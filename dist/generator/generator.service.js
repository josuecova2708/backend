"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratorService = void 0;
const common_1 = require("@nestjs/common");
const ast_parser_service_1 = require("./ast-parser.service");
const graph_sorter_service_1 = require("./graph-sorter.service");
const data_faker_service_1 = require("./data-faker.service");
const sql_builder_service_1 = require("./sql-builder.service");
let GeneratorService = class GeneratorService {
    astParser;
    graphSorter;
    dataFaker;
    sqlBuilder;
    constructor(astParser, graphSorter, dataFaker, sqlBuilder) {
        this.astParser = astParser;
        this.graphSorter = graphSorter;
        this.dataFaker = dataFaker;
        this.sqlBuilder = sqlBuilder;
    }
    generate(sql, rowCount) {
        const tables = this.astParser.parse(sql);
        const sortedTables = this.graphSorter.sort(tables);
        const data = this.dataFaker.generate(sortedTables, rowCount);
        const output = this.sqlBuilder.build(sortedTables, data);
        return output;
    }
};
exports.GeneratorService = GeneratorService;
exports.GeneratorService = GeneratorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [ast_parser_service_1.AstParserService,
        graph_sorter_service_1.GraphSorterService,
        data_faker_service_1.DataFakerService,
        sql_builder_service_1.SqlBuilderService])
], GeneratorService);
//# sourceMappingURL=generator.service.js.map