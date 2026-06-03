import {
    Controller, Get, Param, ParseIntPipe, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GiftOrdersService } from './gift-orders.service';
import { AdminAuthGuard } from '../common/auth.guard';

@Controller('gift-orders')
@UseGuards(AdminAuthGuard)
export class GiftOrdersController {
    constructor(private readonly giftOrders: GiftOrdersService) {}

    /** Bildirishnoma uchun — yetkazilmagan buyurtmalar soni (JSON, polling). */
    @Get('count')
    async count() {
        return { undelivered: await this.giftOrders.undeliveredCount() };
    }

    @Get()
    async list(
        @Query('filter') filter: string,
        @Query('page') page: string,
        @Query('delivered_ok') deliveredOk: string,
        @Res() res: Response,
    ) {
        const f = ['undelivered', 'delivered', 'all'].includes(filter)
            ? (filter as 'all' | 'undelivered' | 'delivered')
            : 'all';
        const data = await this.giftOrders.list(Number(page) || 1, 20, f);
        return res.render('gift-orders', {
            title: "Sovg'a buyurtmalari",
            active: 'gift-orders',
            data,
            delivered_ok: deliveredOk === '1',
        });
    }

    @Post(':id/deliver')
    async deliver(@Param('id', ParseIntPipe) id: number, @Query('filter') filter: string, @Res() res: Response) {
        await this.giftOrders.setDelivered(id, true);
        return res.redirect(`/gift-orders?filter=${filter || 'all'}&delivered_ok=1`);
    }

    @Post(':id/undeliver')
    async undeliver(@Param('id', ParseIntPipe) id: number, @Query('filter') filter: string, @Res() res: Response) {
        await this.giftOrders.setDelivered(id, false);
        return res.redirect(`/gift-orders?filter=${filter || 'all'}`);
    }
}
