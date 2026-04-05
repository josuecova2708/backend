import { TableInfo, GeneratedData } from './interfaces';
export declare class DataFakerService {
    generate(tables: TableInfo[], rowCount: number): GeneratedData[];
    private detectTableDomain;
    private generatePrimaryKey;
    private generateValue;
    private matchByContext;
    private generateNameByDomain;
    private generateDescriptionByDomain;
    private generateTitleByDomain;
    private generateStatusByDomain;
    private matchByName;
    private matchByType;
    private isMatch;
    private applyMaxLength;
    private ensureUnique;
}
