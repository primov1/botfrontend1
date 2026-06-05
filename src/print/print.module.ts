import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PrintService } from './print.service';
import { PdfService } from './pdf.service';
import { PrintController } from './print.controller';
import { Code } from '../common/entities/code.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Code])],
    controllers: [PrintController],
    providers: [PrintService, PdfService],
    exports: [PrintService, PdfService],
})
export class PrintModule {}
