import { Injectable } from '@nestjs/common';
import { TableInfo, GeneratedData } from './interfaces';

@Injectable()
export class SqlBuilderService {
  /**
   * Phase 4: Transform generated data into executable SQL INSERT statements
   * wrapped in a transaction, with sequence resets for SERIAL columns.
   */
  build(tables: TableInfo[], data: GeneratedData[]): string {
    const lines: string[] = [];

    lines.push('BEGIN;');
    lines.push('');

    for (const tableData of data) {
      const tableInfo = tables.find((t) => t.name === tableData.table);
      if (!tableInfo) continue;

      lines.push(`-- Tabla: ${tableData.table}`);

      for (const row of tableData.rows) {
        const values = row.map((val, i) => {
          const col = tableInfo.columns[i];
          return this.formatValue(val, col?.dataType);
        });

        lines.push(
          `INSERT INTO ${this.quoteIdentifier(tableData.table)} (${tableData.columns.map(this.quoteIdentifier).join(', ')}) VALUES (${values.join(', ')});`,
        );
      }

      lines.push('');
    }

    // Generate setval statements for SERIAL/BIGSERIAL columns
    const setvalStatements = this.buildSetvalStatements(tables, data);
    if (setvalStatements.length > 0) {
      lines.push('-- Resincronizar secuencias');
      lines.push(...setvalStatements);
      lines.push('');
    }

    lines.push('COMMIT;');

    return lines.join('\n');
  }

  /**
   * Format a value for SQL insertion, with proper quoting and escaping.
   */
  private formatValue(value: any, dataType?: string): string {
    if (value === null || value === undefined) {
      return 'NULL';
    }

    if (typeof value === 'boolean') {
      return value ? 'TRUE' : 'FALSE';
    }

    if (typeof value === 'number') {
      return value.toString();
    }

    // String values: escape single quotes and wrap in quotes
    const escaped = String(value).replace(/'/g, "''");
    return `'${escaped}'`;
  }

  /**
   * Quote an identifier (table/column name) to handle reserved words and special chars.
   */
  private quoteIdentifier(name: string): string {
    // Only quote if necessary (contains special chars, uppercase, or is a reserved word)
    if (/^[a-z_][a-z0-9_]*$/.test(name)) {
      return name;
    }
    return `"${name}"`;
  }

  /**
   * Build SELECT setval() statements to resynchronize PostgreSQL sequences
   * after explicit INSERT of SERIAL/BIGSERIAL values.
   */
  private buildSetvalStatements(
    tables: TableInfo[],
    data: GeneratedData[],
  ): string[] {
    const statements: string[] = [];

    for (const tableInfo of tables) {
      for (const col of tableInfo.columns) {
        if (
          col.isPrimaryKey &&
          (col.dataType === 'SERIAL' || col.dataType === 'BIGSERIAL')
        ) {
          const tableData = data.find((d) => d.table === tableInfo.name);
          if (!tableData || tableData.rows.length === 0) continue;

          statements.push(
            `SELECT setval(pg_get_serial_sequence('${tableInfo.name}', '${col.name}'), (SELECT MAX(${col.name}) FROM ${this.quoteIdentifier(tableInfo.name)}));`,
          );
        }
      }
    }

    return statements;
  }
}
