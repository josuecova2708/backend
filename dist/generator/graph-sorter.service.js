"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GraphSorterService = void 0;
const common_1 = require("@nestjs/common");
const generator_exceptions_1 = require("./exceptions/generator.exceptions");
var Color;
(function (Color) {
    Color["WHITE"] = "WHITE";
    Color["GRAY"] = "GRAY";
    Color["BLACK"] = "BLACK";
})(Color || (Color = {}));
let GraphSorterService = class GraphSorterService {
    sort(tables) {
        const tableMap = new Map();
        const adjacency = new Map();
        for (const table of tables) {
            tableMap.set(table.name, table);
            adjacency.set(table.name, new Set());
        }
        for (const table of tables) {
            for (const col of table.columns) {
                if (col.isForeignKey && col.foreignKey && !col.isSelfReference) {
                    const depTable = col.foreignKey.table;
                    if (tableMap.has(depTable)) {
                        adjacency.get(table.name).add(depTable);
                    }
                }
            }
        }
        const color = new Map();
        const parent = new Map();
        const result = [];
        for (const tableName of tableMap.keys()) {
            color.set(tableName, Color.WHITE);
            parent.set(tableName, null);
        }
        for (const tableName of tableMap.keys()) {
            if (color.get(tableName) === Color.WHITE) {
                this.dfs(tableName, adjacency, color, parent, result);
            }
        }
        return result.map((name) => tableMap.get(name));
    }
    dfs(node, adjacency, color, parent, result) {
        color.set(node, Color.GRAY);
        const dependencies = adjacency.get(node) || new Set();
        for (const dep of dependencies) {
            const depColor = color.get(dep);
            if (depColor === Color.GRAY) {
                const cycle = this.reconstructCycle(node, dep, parent);
                throw new generator_exceptions_1.CyclicDependencyException(cycle);
            }
            if (depColor === Color.WHITE) {
                parent.set(dep, node);
                this.dfs(dep, adjacency, color, parent, result);
            }
        }
        color.set(node, Color.BLACK);
        result.push(node);
    }
    reconstructCycle(from, to, parent) {
        const cycle = [to];
        let current = from;
        while (current && current !== to) {
            cycle.push(current);
            current = parent.get(current) || null;
        }
        cycle.push(to);
        return cycle.reverse();
    }
};
exports.GraphSorterService = GraphSorterService;
exports.GraphSorterService = GraphSorterService = __decorate([
    (0, common_1.Injectable)()
], GraphSorterService);
//# sourceMappingURL=graph-sorter.service.js.map