import { Module } from '@nestjs/common';
import { GeneratorController } from './generator.controller';
import { GeneratorService } from './generator.service';
import { AstParserService } from './ast-parser.service';
import { GraphSorterService } from './graph-sorter.service';
import { DataFakerService } from './data-faker.service';
import { SqlBuilderService } from './sql-builder.service';

@Module({
  controllers: [GeneratorController],
  providers: [
    GeneratorService,
    AstParserService,
    GraphSorterService,
    DataFakerService,
    SqlBuilderService,
  ],
})
export class GeneratorModule {}
