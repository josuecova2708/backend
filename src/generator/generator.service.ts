import { Injectable } from '@nestjs/common';
import { AstParserService } from './ast-parser.service';
import { GraphSorterService } from './graph-sorter.service';
import { DataFakerService } from './data-faker.service';
import { SqlBuilderService } from './sql-builder.service';

@Injectable()
export class GeneratorService {
  constructor(
    private readonly astParser: AstParserService,
    private readonly graphSorter: GraphSorterService,
    private readonly dataFaker: DataFakerService,
    private readonly sqlBuilder: SqlBuilderService,
  ) {}

  /**
   * Orchestrates the 4-phase pipeline:
   * 1. Parse SQL DDL → structured table info
   * 2. Topological sort → insertion order
   * 3. Generate synthetic data with relational integrity
   * 4. Build SQL INSERT statements
   */
  generate(sql: string, rowCount: number): string {
    // Phase 1: Parse AST
    const tables = this.astParser.parse(sql);

    // Phase 2: Resolve dependencies (topological sort)
    const sortedTables = this.graphSorter.sort(tables);

    // Phase 3: Generate data
    const data = this.dataFaker.generate(sortedTables, rowCount);

    // Phase 4: Build SQL output
    const output = this.sqlBuilder.build(sortedTables, data);

    return output;
  }
}
