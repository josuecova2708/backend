import { TableInfo } from './interfaces';
export declare class AstParserService {
    parse(sql: string): TableInfo[];
    private extractName;
    private resolveDataType;
    private extractMaxLength;
}
