import {
    Body, Controller, Delete, Get, Param, ParseIntPipe, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { CodesService } from './codes.service';
import { ProductsService } from '../products/products.service';
import { AdminAuthGuard } from '../common/auth.guard';

@Controller('admin/codes')
@UseGuards(AdminAuthGuard)
export class CodesController {
    constructor(
        private readonly codesService: CodesService,
        private readonly productsService: ProductsService,
    ) {}

    /** Sahifa: stiker PDF generatsiya formasi */
    @Get()
    async page(
        @Query('generated') generated: string,
        @Query('error') error: string,
        @Res() res: Response,
    ) {
        const [products, stickerText, botUsername] = await Promise.all([
            this.productsService.list(undefined, 1, 1000),
            this.codesService.getStickerText(),
            this.codesService.getBotUsername(),
        ]);

        return res.render('codes', {
            title: 'Kodlar', active: 'codes',
            products: products.items, stickerText, botUsername,
            generated: generated ? Number(generated) : 0,
            error,
        });
    }

    /** Stiker matnini saqlash */
    @Post('sticker-text')
    async saveStickerText(@Body('text') text: string, @Res() res: Response) {
        await this.codesService.setStickerText(text ?? '');
        return res.redirect('/admin/codes');
    }

    /** Kod generatsiya (batch). product_id va count qabul qiladi. */
    @Post('generate')
    async generate(
        @Body('product_id') productId: string,
        @Body('count') count: string,
        @Res() res: Response,
    ) {
        try {
            const { count: n } = await this.codesService.generateCodes(Number(productId), Number(count));
            return res.redirect(`/admin/codes?product_id=${productId}&generated=${n}`);
        } catch (err: any) {
            return res.redirect('/admin/codes?error=' + encodeURIComponent((err?.message || 'Xatolik').slice(0, 120)));
        }
    }

    /** CSV yuklab olish */
    @Get('export/:productId')
    async export(@Param('productId', ParseIntPipe) productId: number, @Res() res: Response) {
        const { filename, content } = await this.codesService.exportToCsv(productId);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    }

    /** Faqat ishlatilmagan kodni o'chirish (UI form uchun) */
    @Post(':id/delete')
    async removeForm(@Param('id', ParseIntPipe) id: number, @Query('back') back: string, @Res() res: Response) {
        try {
            await this.codesService.deleteUnused(id);
        } catch { /* jim */ }
        return res.redirect(back && back.startsWith('/admin/codes') ? back : '/admin/codes');
    }

    /** RESTful DELETE (API) — faqat ishlatilmagan */
    @Delete(':id')
    async remove(@Param('id', ParseIntPipe) id: number) {
        await this.codesService.deleteUnused(id);
        return { success: true };
    }
}
