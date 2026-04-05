import type { Response } from 'express';
import { GeneratorService } from './generator.service';
export declare class GeneratorController {
    private readonly generatorService;
    constructor(generatorService: GeneratorService);
    generate(file: Express.Multer.File | undefined, sqlText: string | undefined, rowCountRaw: string | undefined, res: Response): Promise<void>;
}
