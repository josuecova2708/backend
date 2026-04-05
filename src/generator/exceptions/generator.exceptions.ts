import { HttpException, HttpStatus } from '@nestjs/common';

export class CyclicDependencyException extends HttpException {
  constructor(cycle: string[]) {
    super(
      {
        error: 'CYCLE_DETECTED',
        message: `Dependencia circular: ${cycle.join(' → ')}`,
        suggestion:
          'Revisa si alguna FK puede ser nullable para romper el ciclo.',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class NoTablesFoundException extends HttpException {
  constructor() {
    super(
      {
        error: 'NO_TABLES_FOUND',
        message:
          'No se encontraron sentencias CREATE TABLE en el SQL proporcionado.',
        suggestion:
          'Asegúrate de enviar un DDL válido con al menos una sentencia CREATE TABLE.',
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

export class SqlParseException extends HttpException {
  constructor(detail: string) {
    super(
      {
        error: 'PARSE_ERROR',
        message: `Error al parsear el SQL: ${detail}`,
        suggestion:
          'Verifica que el SQL sea válido y use sintaxis de PostgreSQL.',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

export class InvalidRowCountException extends HttpException {
  constructor() {
    super(
      {
        error: 'INVALID_ROW_COUNT',
        message: 'rowCount debe ser un número entero positivo.',
        suggestion: 'Envía un valor numérico mayor a 0.',
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
