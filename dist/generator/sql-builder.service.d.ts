import { TableInfo, GeneratedData } from './interfaces';
export declare class SqlBuilderService {
    build(tables: TableInfo[], data: GeneratedData[]): string;
    private formatValue;
    private quoteIdentifier;
    private buildSetvalStatements;
}
