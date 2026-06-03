import { Controller, Get, Param, ParseIntPipe, Query, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { PrintService } from './print.service';
import { CodesService } from '../codes/codes.service';
import { AdminAuthGuard } from '../common/auth.guard';

@Controller('admin/print')
@UseGuards(AdminAuthGuard)
export class PrintController {
    constructor(
        private readonly printService: PrintService,
        private readonly codesService: CodesService,
    ) {}

    /** Bitta kodni qayta chop etish. (':productId' dan OLDIN bo'lishi shart) */
    @Get('single/:codeId')
    async single(@Param('codeId', ParseIntPipe) codeId: number, @Res() res: Response) {
        const code = await this.codesService.findById(codeId);
        if (!code) {
            res.status(404).send('Kod topilmadi');
            return;
        }
        const stickers = await this.printService.generateStickerHtml([code]);
        const html = this.printService.wrapPage(stickers, { title: `Stiker — ${code.code}`, info: '1 ta stiker' });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }

    /** Mahsulot kodlari stikerlari — sahifalab (100 tadan). Ctrl+P bilan chop etiladi. */
    @Get(':productId')
    async print(
        @Param('productId', ParseIntPipe) productId: number,
        @Query('page') page: string,
        @Query('limit') limit: string,
        @Res() res: Response,
    ) {
        const data = await this.printService.paginateCodes(productId, Number(page) || 1, Number(limit) || 100);
        const stickers = await this.printService.generateStickerHtml(data.items);
        const html = this.printService.wrapPage(stickers, {
            title: `Stikerlar — P${productId}`,
            info: `Sahifa ${data.page}/${data.totalPages} • ${data.items.length} ta stiker • Jami: ${data.total}`,
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }
}
