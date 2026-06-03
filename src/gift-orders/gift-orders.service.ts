import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { GiftPurchase } from '../common/entities/gift-purchase.entity';

@Injectable()
export class GiftOrdersService implements OnModuleInit {
    private readonly logger = new Logger(GiftOrdersService.name);

    constructor(
        @InjectRepository(GiftPurchase)
        private readonly giftPurchaseRepo: Repository<GiftPurchase>,
        private readonly dataSource: DataSource,
    ) {}

    async onModuleInit(): Promise<void> {
        // synchronize:false bo'lgani uchun ustunni qo'lda qo'shamiz (idempotent)
        try {
            await this.dataSource.query(
                'ALTER TABLE "gift_purchases" ADD COLUMN IF NOT EXISTS "delivered" boolean NOT NULL DEFAULT false',
            );
        } catch (err) {
            this.logger.warn(`gift_purchases.delivered qo'shilmadi: ${(err as Error).message}`);
        }
    }

    /** Yetkazilmagan (yangi) sovg'a buyurtmalari soni — bildirishnoma uchun. */
    async undeliveredCount(): Promise<number> {
        return this.giftPurchaseRepo.count({ where: { delivered: false } });
    }

    async list(page = 1, limit = 20, filter: 'all' | 'undelivered' | 'delivered' = 'all') {
        page = Math.max(1, Math.floor(page) || 1);
        limit = Math.min(100, Math.max(5, Math.floor(limit) || 20));

        const where =
            filter === 'undelivered' ? { delivered: false }
            : filter === 'delivered' ? { delivered: true }
            : {};

        const [rows, total, totalCount, undelivered] = await Promise.all([
            this.giftPurchaseRepo.find({
                where,
                order: { createdAt: 'DESC' },
                skip: (page - 1) * limit,
                take: limit,
                relations: ['user', 'gift'],
            }),
            this.giftPurchaseRepo.count({ where }),
            this.giftPurchaseRepo.count(),
            this.undeliveredCount(),
        ]);

        const items = rows.map((r) => ({
            id: r.id,
            price: r.price ?? 0,
            delivered: !!r.delivered,
            createdAt: r.createdAt,
            user: r.user
                ? {
                      id: r.user.id,
                      firstName: r.user.firstName ?? '',
                      lastName: r.user.lastName ?? '',
                      phone: r.user.phone ?? '',
                      username: r.user.username ?? '',
                  }
                : null,
            gift: r.gift
                ? { id: r.gift.id, title: r.gift.title, image: r.gift.image }
                : null,
        }));

        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            items, total, page, limit, totalPages,
            hasPrev: page > 1, hasNext: page < totalPages,
            prevPage: Math.max(1, page - 1), nextPage: Math.min(totalPages, page + 1),
            filter,
            counts: { all: totalCount, undelivered, delivered: totalCount - undelivered },
        };
    }

    async setDelivered(id: number, delivered: boolean): Promise<void> {
        const order = await this.giftPurchaseRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Buyurtma topilmadi');
        order.delivered = delivered;
        await this.giftPurchaseRepo.save(order);
    }
}
