"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.InvalidRowCountException = exports.SqlParseException = exports.NoTablesFoundException = exports.CyclicDependencyException = void 0;
const common_1 = require("@nestjs/common");
class CyclicDependencyException extends common_1.HttpException {
    constructor(cycle) {
        super({
            error: 'CYCLE_DETECTED',
            message: `Dependencia circular: ${cycle.join(' → ')}`,
            suggestion: 'Revisa si alguna FK puede ser nullable para romper el ciclo.',
        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
exports.CyclicDependencyException = CyclicDependencyException;
class NoTablesFoundException extends common_1.HttpException {
    constructor() {
        super({
            error: 'NO_TABLES_FOUND',
            message: 'No se encontraron sentencias CREATE TABLE en el SQL proporcionado.',
            suggestion: 'Asegúrate de enviar un DDL válido con al menos una sentencia CREATE TABLE.',
        }, common_1.HttpStatus.UNPROCESSABLE_ENTITY);
    }
}
exports.NoTablesFoundException = NoTablesFoundException;
class SqlParseException extends common_1.HttpException {
    constructor(detail) {
        super({
            error: 'PARSE_ERROR',
            message: `Error al parsear el SQL: ${detail}`,
            suggestion: 'Verifica que el SQL sea válido y use sintaxis de PostgreSQL.',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.SqlParseException = SqlParseException;
class InvalidRowCountException extends common_1.HttpException {
    constructor() {
        super({
            error: 'INVALID_ROW_COUNT',
            message: 'rowCount debe ser un número entero positivo.',
            suggestion: 'Envía un valor numérico mayor a 0.',
        }, common_1.HttpStatus.BAD_REQUEST);
    }
}
exports.InvalidRowCountException = InvalidRowCountException;
//# sourceMappingURL=generator.exceptions.js.map