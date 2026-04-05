"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AstParserService = void 0;
const common_1 = require("@nestjs/common");
const pgsql_ast_parser_1 = require("pgsql-ast-parser");
const generator_exceptions_1 = require("./exceptions/generator.exceptions");
let AstParserService = class AstParserService {
    parse(sql) {
        let statements;
        try {
            statements = (0, pgsql_ast_parser_1.parse)(sql);
        }
        catch (err) {
            throw new generator_exceptions_1.SqlParseException(err.message || 'Syntax error desconocido');
        }
        const tables = [];
        for (const stmt of statements) {
            if (stmt.type !== 'create table')
                continue;
            const tableName = stmt.name?.name;
            if (!tableName)
                continue;
            const tableLevelPKs = new Set();
            const tableLevelUniques = new Set();
            const tableLevelFKs = new Map();
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
                        const localCols = (c.localColumns || []).map((x) => this.extractName(x));
                        const refTable = this.extractName(c.foreignTable);
                        const refCols = (c.foreignColumns || []).map((x) => this.extractName(x));
                        localCols.forEach((localCol, i) => {
                            tableLevelFKs.set(localCol, {
                                table: refTable,
                                column: refCols[i] || refCols[0] || 'id',
                            });
                        });
                    }
                }
            }
            const columns = [];
            if (stmt.columns && Array.isArray(stmt.columns)) {
                for (const colDef of stmt.columns) {
                    if (colDef.kind !== 'column')
                        continue;
                    const colName = this.extractName(colDef.name);
                    if (!colName)
                        continue;
                    const dataType = this.resolveDataType(colDef.dataType);
                    const maxLength = this.extractMaxLength(colDef.dataType);
                    let isPrimaryKey = tableLevelPKs.has(colName);
                    let isUnique = tableLevelUniques.has(colName);
                    let isNullable = true;
                    let isForeignKey = tableLevelFKs.has(colName);
                    let foreignKey = tableLevelFKs.get(colName) || undefined;
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
                    if (isPrimaryKey || dataType === 'SERIAL' || dataType === 'BIGSERIAL') {
                        isNullable = false;
                    }
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
            throw new generator_exceptions_1.NoTablesFoundException();
        }
        return tables;
    }
    extractName(node) {
        if (!node)
            return '';
        if (typeof node === 'string')
            return node;
        if (node.name)
            return typeof node.name === 'string' ? node.name : this.extractName(node.name);
        return String(node);
    }
    resolveDataType(dataType) {
        if (!dataType)
            return 'TEXT';
        const name = (dataType.name || '').toUpperCase();
        const aliases = {
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
    extractMaxLength(dataType) {
        if (!dataType)
            return undefined;
        if (dataType.config && Array.isArray(dataType.config)) {
            const first = dataType.config[0];
            if (typeof first === 'number')
                return first;
        }
        return undefined;
    }
};
exports.AstParserService = AstParserService;
exports.AstParserService = AstParserService = __decorate([
    (0, common_1.Injectable)()
], AstParserService);
//# sourceMappingURL=ast-parser.service.js.map