import { HttpException } from '@nestjs/common';
export declare class CyclicDependencyException extends HttpException {
    constructor(cycle: string[]);
}
export declare class NoTablesFoundException extends HttpException {
    constructor();
}
export declare class SqlParseException extends HttpException {
    constructor(detail: string);
}
export declare class InvalidRowCountException extends HttpException {
    constructor();
}
