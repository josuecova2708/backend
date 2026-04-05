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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.GeneratorController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const generator_service_1 = require("./generator.service");
const generator_exceptions_1 = require("./exceptions/generator.exceptions");
let GeneratorController = class GeneratorController {
    generatorService;
    constructor(generatorService) {
        this.generatorService = generatorService;
    }
    async generate(file, sqlText, rowCountRaw, res) {
        const input = file ? file.buffer.toString('utf-8') : sqlText;
        if (!input || input.trim().length === 0) {
            throw new common_1.BadRequestException({
                error: 'NO_INPUT',
                message: 'Debes enviar un archivo .sql o texto SQL.',
                suggestion: 'Envía el campo "file" con un archivo .sql o el campo "sql" con texto DDL.',
            });
        }
        const rowCount = rowCountRaw ? parseInt(rowCountRaw, 10) : 10;
        if (isNaN(rowCount) || rowCount <= 0) {
            throw new generator_exceptions_1.InvalidRowCountException();
        }
        const sql = this.generatorService.generate(input, rowCount);
        res.setHeader('Content-Type', 'text/plain; charset=utf-8');
        res.setHeader('Content-Disposition', 'attachment; filename="seed.sql"');
        res.send(sql);
    }
};
exports.GeneratorController = GeneratorController;
__decorate([
    (0, common_1.Post)('generate'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('file')),
    __param(0, (0, common_1.UploadedFile)()),
    __param(1, (0, common_1.Body)('sql')),
    __param(2, (0, common_1.Body)('rowCount')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object, Object]),
    __metadata("design:returntype", Promise)
], GeneratorController.prototype, "generate", null);
exports.GeneratorController = GeneratorController = __decorate([
    (0, common_1.Controller)('generator'),
    __metadata("design:paramtypes", [generator_service_1.GeneratorService])
], GeneratorController);
//# sourceMappingURL=generator.controller.js.map