import { Telegraf } from 'telegraf';
import { Repository } from 'typeorm';
import { Code } from '../common/entities/code.entity';
import { CodesService } from '../codes/codes.service';
export declare class PrintService {
    private readonly codeRepo;
    private readonly bot;
    private readonly codesService;
    private cachedUsername?;
    private cachedLogo?;
    constructor(codeRepo: Repository<Code>, bot: Telegraf, codesService: CodesService);
    paginateCodes(productId: number, page?: number, limit?: number): Promise<{
        items: Code[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
    }>;
    getBotUsername(): Promise<string>;
    generateQrCode(url: string): Promise<string>;
    private getLogoDataUrl;
    private esc;
    private fmtExpiry;
    generateStickerHtml(codes: Code[]): Promise<string>;
    wrapPage(stickersHtml: string, meta: {
        title: string;
        info: string;
    }): string;
}
