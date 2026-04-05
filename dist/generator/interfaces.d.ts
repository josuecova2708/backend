export interface ColumnInfo {
    name: string;
    dataType: string;
    maxLength?: number;
    isPrimaryKey: boolean;
    isForeignKey: boolean;
    isUnique: boolean;
    isNullable: boolean;
    isSelfReference: boolean;
    foreignKey?: {
        table: string;
        column: string;
    };
}
export interface TableInfo {
    name: string;
    columns: ColumnInfo[];
}
export interface GeneratedData {
    table: string;
    columns: string[];
    rows: any[][];
}
