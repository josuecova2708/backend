import {
  Controller,
  Post,
  Body,
  UploadedFile,
  UseInterceptors,
  BadRequestException,
  Res,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Response } from 'express';
import { GeneratorService } from './generator.service';
import { InvalidRowCountException } from './exceptions/generator.exceptions';

@Controller('generator')
export class GeneratorController {
  constructor(private readonly generatorService: GeneratorService) {}

  @Post('generate')
  @UseInterceptors(FileInterceptor('file'))
  async generate(
    @UploadedFile() file: Express.Multer.File | undefined,
    @Body('sql') sqlText: string | undefined,
    @Body('rowCount') rowCountRaw: string | undefined,
    @Res() res: Response,
  ) {
    // Resolve input: file takes precedence over text
    const input = file ? file.buffer.toString('utf-8') : sqlText;
    if (!input || input.trim().length === 0) {
      throw new BadRequestException({
        error: 'NO_INPUT',
        message: 'Debes enviar un archivo .sql o texto SQL.',
        suggestion: 'Envía el campo "file" con un archivo .sql o el campo "sql" con texto DDL.',
      });
    }

    // Parse and validate rowCount
    const rowCount = rowCountRaw ? parseInt(rowCountRaw, 10) : 10;
    if (isNaN(rowCount) || rowCount <= 0) {
      throw new InvalidRowCountException();
    }

    // Generate
    const sql = this.generatorService.generate(input, rowCount);

    // Return as downloadable text file
    res.setHeader('Content-Type', 'text/plain; charset=utf-8');
    res.setHeader('Content-Disposition', 'attachment; filename="seed.sql"');
    res.send(sql);
  }
}
