import type { Response } from 'express';
import { PrintService } from './print.service';
import { PdfService } from './pdf.service';
import { CodesService } from '../codes/codes.service';
export declare class PrintController {
    private readonly printService;
    private readonly pdfService;
    private readonly codesService;
    constructor(printService: PrintService, pdfService: PdfService, codesService: CodesService);
    generatePdf(text: string, count: string, productId: string, res: Response): Promise<void>;
    single(codeId: number, res: Response): Promise<void>;
    print(productId: number, page: string, limit: string, res: Response): Promise<void>;
}
