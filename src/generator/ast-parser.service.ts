import { Injectable } from '@nestjs/common';
import { parse } from 'pgsql-ast-parser';
import { TableInfo, ColumnInfo } from './interfaces';
import {
  SqlParseException,
  NoTablesFoundException,
} from './exceptions/generator.exceptions';

@Injectable()
export class AstParserService {
  /**
   * Phase 1: Parse raw SQL DDL into structured TableInfo objects.
   * Extracts tables, columns, types, PKs, FKs, UNIQUE, and NULLABLE info.
   */
  parse(sql: string): TableInfo[] {
    let statements: any[];

    try {
      statements = parse(sql) as any[];
    } catch (err: any) {
      throw new SqlParseException(err.message || 'Syntax error desconocido');
    }

    const tables: TableInfo[] = [];

    for (const stmt of statements) {
      if (stmt.type !== 'create table') continue;

      const tableName = stmt.name?.name;
      if (!tableName) continue;

      // Collect table-level constraint info
      const tableLevelPKs = new Set<string>();
      const tableLevelUniques = new Set<string>();
      const tableLevelFKs = new Map<string, { table: string; column: string }>();

      // Process table-level constraints (from stmt.constraints array)
      if (stmt.constraints && Array.isArray(stmt.constraints)) {
        for (const c of stmt.constraints) {
          if (c.type === 'primary key' && c.columns) {
            for (const col of c.columns) {
              tableLevelPKs.add(this.extractName(col));
            }
          }

          if (c.type === 'unique' && c.columns) {
            for (const col of c.columns) {
              tableLevelUniques.add(this.extractName(col));
            }
          }

          if (c.type === 'foreign key') {
            const localCols = (c.localColumns || []).map((x: any) => this.extractName(x));
            const refTable = this.extractName(c.foreignTable);
            const refCols = (c.foreignColumns || []).map((x: any) => this.extractName(x));

            localCols.forEach((localCol: string, i: number) => {
              tableLevelFKs.set(localCol, {
                table: refTable,
                column: refCols[i] || refCols[0] || 'id',
              });
            });
          }
        }
      }

      const columns: ColumnInfo[] = [];

      // Process column definitions
      if (stmt.columns && Array.isArray(stmt.columns)) {
        for (const colDef of stmt.columns) {
          // Skip non-column entries (table-level constraints that may appear here)
          if (colDef.kind !== 'column') continue;

          const colName = this.extractName(colDef.name);
          if (!colName) continue;

          const dataType = this.resolveDataType(colDef.dataType);
          const maxLength = this.extractMaxLength(colDef.dataType);

          // Start with table-level constraint info
          let isPrimaryKey = tableLevelPKs.has(colName);
          let isUnique = tableLevelUniques.has(colName);
          let isNullable = true;
          let isForeignKey = tableLevelFKs.has(colName);
          let foreignKey = tableLevelFKs.get(colName) || undefined;

          // Check column-level constraints
          if (colDef.constraints && Array.isArray(colDef.constraints)) {
            for (const constraint of colDef.constraints) {
              if (constraint.type === 'primary key') {
                isPrimaryKey = true;
              }
              if (constraint.type === 'not null') {
                isNullable = false;
              }
              if (constraint.type === 'unique') {
                isUnique = true;
              }
              if (constraint.type === 'reference') {
                isForeignKey = true;
                const refTableName = this.extractName(constraint.foreignTable);
                const refCols = constraint.foreignColumns || [];
                const refCol = refCols.length > 0 ? this.extractName(refCols[0]) : 'id';

                foreignKey = {
                  table: refTableName,
                  column: refCol,
                };
              }
            }
          }

          // PKs and SERIAL types are implicitly NOT NULL
          if (isPrimaryKey || dataType === 'SERIAL' || dataType === 'BIGSERIAL') {
            isNullable = false;
          }

          // Detect self-reference
          const isSelfReference = isForeignKey && foreignKey?.table === tableName;

          columns.push({
            name: colName,
            dataType,
            maxLength,
            isPrimaryKey,
            isForeignKey,
            isUnique: isUnique || isPrimaryKey,
            isNullable,
            isSelfReference,
            foreignKey,
          });
        }
      }

      tables.push({ name: tableName, columns });
    }

    if (tables.length === 0) {
      throw new NoTablesFoundException();
    }

    return tables;
  }

  /**
   * Safely extract a name string from various AST node formats.
   * pgsql-ast-parser uses { name: "..." } objects for identifiers.
   */
  private extractName(node: any): string {
    if (!node) return '';
    if (typeof node === 'string') return node;
    if (node.name) return typeof node.name === 'string' ? node.name : this.extractName(node.name);
    return String(node);
  }

  /**
   * Normalize SQL data types to uppercase canonical forms.
   */
  private resolveDataType(dataType: any): string {
    if (!dataType) return 'TEXT';

    const name = (dataType.name || '').toUpperCase();

    const aliases: Record<string, string> = {
      INT: 'INTEGER',
      INT4: 'INTEGER',
      INT8: 'BIGINT',
      INT2: 'SMALLINT',
      FLOAT4: 'REAL',
      FLOAT8: 'DOUBLE PRECISION',
      BOOL: 'BOOLEAN',
      'CHARACTER VARYING': 'VARCHAR',
      CHARACTER: 'CHAR',
    };

    return aliases[name] || name;
  }

  /**
   * Extract the max length param from types like VARCHAR(N), CHAR(N).
   * pgsql-ast-parser stores this in dataType.config as [N].
   */
  private extractMaxLength(dataType: any): number | undefined {
    if (!dataType) return undefined;

    if (dataType.config && Array.isArray(dataType.config)) {
      const first = dataType.config[0];
      if (typeof first === 'number') return first;
    }

    return undefined;
  }
}
