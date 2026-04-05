import { AstParserService } from './ast-parser.service';
import { GraphSorterService } from './graph-sorter.service';
import { DataFakerService } from './data-faker.service';
import { SqlBuilderService } from './sql-builder.service';
export declare class GeneratorService {
    private readonly astParser;
    private readonly graphSorter;
    private readonly dataFaker;
    private readonly sqlBuilder;
    constructor(astParser: AstParserService, graphSorter: GraphSorterService, dataFaker: DataFakerService, sqlBuilder: SqlBuilderService);
    generate(sql: string, rowCount: number): string;
}
