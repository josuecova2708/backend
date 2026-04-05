/**
 * Shared interfaces for the generator module.
 * These types represent the structured output of the AST parser
 * and are consumed by downstream phases.
 */

export interface ColumnInfo {
  name: string;
  dataType: string; // Normalized uppercase, e.g. 'VARCHAR', 'INTEGER', 'SERIAL'
  maxLength?: number; // For VARCHAR(N), CHAR(N)
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
