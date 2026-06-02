import { Controller, Get, Res, UseGuards } from '@nestjs/common';
import type { Response } from 'express';
import { UsersService } from '../users/users.service';
import { ProductsService } from '../products/products.service';
import { GiftsService } from '../gifts/gifts.service';
import { ConfirmationsService } from '../confirmations/confirmations.service';
import { AdminAuthGuard } from '../common/auth.guard';

@Controller()
@UseGuards(AdminAuthGuard)
export class DashboardController {
    constructor(
        private readonly usersService: UsersService,
        private readonly productsService: ProductsService,
        private readonly giftsService: GiftsService,
        private readonly confirmationsService: ConfirmationsService,
    ) {}

    @Get('/')
    async index(@Res() res: Response) {
        const [
            usersCount,
            productsCount,
            giftsCount,
            confirmCounts,
            topUsers,
            topProducts,
            dailySales,
            regStats,
        ] = await Promise.all([
            this.usersService.count(),
            this.productsService.count(),
            this.giftsService.count(),
            this.confirmationsService.counts(),
            this.usersService.topBonusUsers(),
            this.productsService.topSoldProducts(),
            this.productsService.dailySalesStats(),
            this.usersService.registrationStats(),
        ]);

        // Grafiklar uchun JSON string'ga o'giramiz (HBS template ichida xavfsiz)
        const salesChartData = JSON.stringify({
            labels: dailySales.map(d => d.day.slice(5)),   // MM-DD
            sales:  dailySales.map(d => d.count),
            bonus:  dailySales.map(d => d.bonusTotal),
        });
        const regChartData = JSON.stringify({
            labels: regStats.map(d => d.day.slice(5)),
            counts: regStats.map(d => d.count),
        });

        return res.render('dashboard', {
            title: 'Boshqaruv paneli',
            active: 'dashboard',
            stats: {
                users: usersCount,
                products: productsCount,
                gifts: giftsCount,
                pending: confirmCounts.pending,
                approved: confirmCounts.approved,
            },
            topUsers,
            topProducts,
            salesChartData,
            regChartData,
        });
    }
}
