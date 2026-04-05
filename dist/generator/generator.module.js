"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratorModule = void 0;
const common_1 = require("@nestjs/common");
const generator_controller_1 = require("./generator.controller");
const generator_service_1 = require("./generator.service");
const ast_parser_service_1 = require("./ast-parser.service");
const graph_sorter_service_1 = require("./graph-sorter.service");
const data_faker_service_1 = require("./data-faker.service");
const sql_builder_service_1 = require("./sql-builder.service");
let GeneratorModule = class GeneratorModule {
};
exports.GeneratorModule = GeneratorModule;
exports.GeneratorModule = GeneratorModule = __decorate([
    (0, common_1.Module)({
        controllers: [generator_controller_1.GeneratorController],
        providers: [
            generator_service_1.GeneratorService,
            ast_parser_service_1.AstParserService,
            graph_sorter_service_1.GraphSorterService,
            data_faker_service_1.DataFakerService,
            sql_builder_service_1.SqlBuilderService,
        ],
    })
], GeneratorModule);
//# sourceMappingURL=generator.module.js.map