import { TableInfo } from './interfaces';
export declare class GraphSorterService {
    sort(tables: TableInfo[]): TableInfo[];
    private dfs;
    private reconstructCycle;
}
