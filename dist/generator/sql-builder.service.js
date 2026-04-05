"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SqlBuilderService = void 0;
const common_1 = require("@nestjs/common");
let SqlBuilderService = class SqlBuilderService {
    build(tables, data) {
        const lines = [];
        lines.push('BEGIN;');
        lines.push('');
        for (const tableData of data) {
            const tableInfo = tables.find((t) => t.name === tableData.table);
            if (!tableInfo)
                continue;
            lines.push(`-- Tabla: ${tableData.table}`);
            for (const row of tableData.rows) {
                const values = row.map((val, i) => {
                    const col = tableInfo.columns[i];
                    return this.formatValue(val, col?.dataType);
                });
                lines.push(`INSERT INTO ${this.quoteIdentifier(tableData.table)} (${tableData.columns.map(this.quoteIdentifier).join(', ')}) VALUES (${values.join(', ')});`);
            }
            lines.push('');
        }
        const setvalStatements = this.buildSetvalStatements(tables, data);
        if (setvalStatements.length > 0) {
            lines.push('-- Resincronizar secuencias');
            lines.push(...setvalStatements);
            lines.push('');
        }
        lines.push('COMMIT;');
        return lines.join('\n');
    }
    formatValue(value, dataType) {
        if (value === null || value === undefined) {
            return 'NULL';
        }
        if (typeof value === 'boolean') {
            return value ? 'TRUE' : 'FALSE';
        }
        if (typeof value === 'number') {
            return value.toString();
        }
        const escaped = String(value).replace(/'/g, "''");
        return `'${escaped}'`;
    }
    quoteIdentifier(name) {
        if (/^[a-z_][a-z0-9_]*$/.test(name)) {
            return name;
        }
        return `"${name}"`;
    }
    buildSetvalStatements(tables, data) {
        const statements = [];
        for (const tableInfo of tables) {
            for (const col of tableInfo.columns) {
                if (col.isPrimaryKey &&
                    (col.dataType === 'SERIAL' || col.dataType === 'BIGSERIAL')) {
                    const tableData = data.find((d) => d.table === tableInfo.name);
                    if (!tableData || tableData.rows.length === 0)
                        continue;
                    statements.push(`SELECT setval(pg_get_serial_sequence('${tableInfo.name}', '${col.name}'), (SELECT MAX(${col.name}) FROM ${this.quoteIdentifier(tableInfo.name)}));`);
                }
            }
        }
        return statements;
    }
};
exports.SqlBuilderService = SqlBuilderService;
exports.SqlBuilderService = SqlBuilderService = __decorate([
    (0, common_1.Injectable)()
], SqlBuilderService);
//# sourceMappingURL=sql-builder.service.js.map