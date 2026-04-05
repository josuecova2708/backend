import { Module } from '@nestjs/common';
import { GeneratorModule } from './generator/generator.module';

@Module({
  imports: [GeneratorModule],
})
export class AppModule {}
