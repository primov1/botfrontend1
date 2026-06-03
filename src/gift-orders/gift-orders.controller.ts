import {
    Controller, Get, Param, ParseIntPipe, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { GiftOrdersService, GiftStatus } from './gift-orders.service';
import { AdminAuthGuard } from '../common/auth.guard';

@Controller('gift-orders')
@UseGuards(AdminAuthGuard)
export class GiftOrdersController {
    constructor(private readonly giftOrders: GiftOrdersService) {}

    /** Bildirishnoma uchun — tasdiq kutayotgan so'rovlar soni (JSON, polling). */
    @Get('count')
    async count() {
        return { pending: await this.giftOrders.pendingCount() };
    }

    @Get()
    async list(
        @Query('filter') filter: string,
        @Query('page') page: string,
        @Query('ok') ok: string,
        @Res() res: Response,
    ) {
        const f = (['pending', 'approved', 'rejected', 'all'].includes(filter) ? filter : 'pending') as GiftStatus | 'all';
        const data = await this.giftOrders.list(Number(page) || 1, 20, f);
        return res.render('gift-orders', {
            title: "Sovg'a buyurtmalari",
            active: 'gift-orders',
            data,
            ok,
        });
    }

    @Post(':id/approve')
    async approve(@Param('id', ParseIntPipe) id: number, @Query('filter') filter: string, @Res() res: Response) {
        await this.giftOrders.approve(id);
        return res.redirect(`/gift-orders?filter=${filter || 'pending'}&ok=approved`);
    }

    @Post(':id/reject')
    async reject(@Param('id', ParseIntPipe) id: number, @Query('filter') filter: string, @Res() res: Response) {
        await this.giftOrders.reject(id);
        return res.redirect(`/gift-orders?filter=${filter || 'pending'}&ok=rejected`);
    }

    @Post(':id/deliver')
    async deliver(@Param('id', ParseIntPipe) id: number, @Query('filter') filter: string, @Res() res: Response) {
        await this.giftOrders.setDelivered(id, true);
        return res.redirect(`/gift-orders?filter=${filter || 'approved'}&ok=delivered`);
    }

    @Post(':id/delete')
    async remove(@Param('id', ParseIntPipe) id: number, @Query('filter') filter: string, @Res() res: Response) {
        await this.giftOrders.delete(id);
        return res.redirect(`/gift-orders?filter=${filter || 'all'}&ok=deleted`);
    }
}
