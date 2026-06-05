import { Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { DataSource, Repository } from 'typeorm';
import { GiftPurchase } from '../common/entities/gift-purchase.entity';
import { User } from '../common/entities/user.entity';
import { Gift } from '../common/entities/gift.entity';

export type GiftStatus = 'pending' | 'approved' | 'rejected';

@Injectable()
export class GiftOrdersService implements OnModuleInit {
    private readonly logger = new Logger(GiftOrdersService.name);

    constructor(
        @InjectRepository(GiftPurchase)
        private readonly giftPurchaseRepo: Repository<GiftPurchase>,
        @InjectBot() private readonly bot: Telegraf,
        private readonly dataSource: DataSource,
    ) {}

    async onModuleInit(): Promise<void> {
        for (const sql of [
            'ALTER TABLE "gift_purchases" ADD COLUMN IF NOT EXISTS "delivered" boolean NOT NULL DEFAULT false',
            `ALTER TABLE "gift_purchases" ADD COLUMN IF NOT EXISTS "status" varchar NOT NULL DEFAULT 'pending'`,
        ]) {
            try { await this.dataSource.query(sql); }
            catch (err) { this.logger.warn(`gift_purchases ustun: ${(err as Error).message}`); }
        }
    }

    /** Tasdiq kutayotgan sovg'a so'rovlari soni — bildirishnoma uchun. */
    async pendingCount(): Promise<number> {
        return this.giftPurchaseRepo.count({ where: { status: 'pending' } });
    }

    async counts() {
        const [pending, approved, rejected, all] = await Promise.all([
            this.giftPurchaseRepo.count({ where: { status: 'pending' } }),
            this.giftPurchaseRepo.count({ where: { status: 'approved' } }),
            this.giftPurchaseRepo.count({ where: { status: 'rejected' } }),
            this.giftPurchaseRepo.count(),
        ]);
        return { pending, approved, rejected, all };
    }

    async list(page = 1, limit = 20, filter: GiftStatus | 'all' = 'pending') {
        page = Math.max(1, Math.floor(page) || 1);
        limit = Math.min(100, Math.max(5, Math.floor(limit) || 20));

        const where = filter === 'all' ? {} : { status: filter as GiftStatus };

        const [rows, total, counts] = await Promise.all([
            this.giftPurchaseRepo.find({
                where, order: { createdAt: 'DESC' },
                skip: (page - 1) * limit, take: limit,
                relations: ['user', 'gift'],
            }),
            this.giftPurchaseRepo.count({ where }),
            this.counts(),
        ]);

        const items = rows.map((r) => ({
            id: r.id,
            price: r.price ?? 0,
            status: r.status ?? 'pending',
            delivered: !!r.delivered,
            createdAt: r.createdAt,
            user: r.user
                ? { id: r.user.id, firstName: r.user.firstName ?? '', lastName: r.user.lastName ?? '', phone: r.user.phone ?? '' }
                : null,
            gift: r.gift ? { id: r.gift.id, title: r.gift.title, image: r.gift.image } : null,
        }));

        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            items, total, page, limit, totalPages,
            hasPrev: page > 1, hasNext: page < totalPages,
            prevPage: Math.max(1, page - 1), nextPage: Math.min(totalPages, page + 1),
            filter, counts,
        };
    }

    /** Tasdiqlash — bonus allaqachon ushlangan, faqat holatni o'zgartiramiz. */
    async approve(id: number): Promise<void> {
        let notifyTelegramId: number | undefined;
        let title = '';

        await this.dataSource.transaction(async (em) => {
            const order = await em.findOne(GiftPurchase, { where: { id }, lock: { mode: 'pessimistic_write' } });
            if (!order) throw new NotFoundException('Buyurtma topilmadi');
            if (order.status === 'approved') return;

            order.status = 'approved';
            await em.save(order);

            const [user, gift] = await Promise.all([
                em.findOne(User, { where: { id: order.userId } }),
                order.giftId ? em.findOne(Gift, { where: { id: order.giftId } }) : Promise.resolve(null),
            ]);
            notifyTelegramId = user?.telegramId;
            title = gift?.title ?? 'sovg\'a';
        });

        const [adminPhone, adminTg] = await Promise.all([
            this.getSetting('gift_admin_phone'),
            this.getSetting('gift_admin_telegram'),
        ]);
        let contactLine = '';
        if (adminPhone || adminTg) {
            contactLine = '\n\n📞 Bog\'lanish uchun:';
            if (adminPhone) contactLine += `\n📱 Tel: ${adminPhone}`;
            if (adminTg) contactLine += `\n✈️ Telegram: @${adminTg.replace(/^@/, '')}`;
        }
        await this.notify(notifyTelegramId,
            `✅ Tabriklaymiz! "${title}" sovg'angiz tasdiqlandi.${contactLine}`,
        );
    }

    /** Rad etish — bonus FOYDALANUVCHIGA QAYTARILADI. */
    async reject(id: number): Promise<void> {
        let notifyTelegramId: number | undefined;
        let title = '';
        let price = 0;

        await this.dataSource.transaction(async (em) => {
            const order = await em.findOne(GiftPurchase, { where: { id }, lock: { mode: 'pessimistic_write' } });
            if (!order) throw new NotFoundException('Buyurtma topilmadi');
            if (order.status === 'rejected') return;

            // Bonusni qaytaramiz (oldin ushlangan edi)
            if (order.price > 0) {
                await em.createQueryBuilder()
                    .update(User)
                    .set({ bonus: () => '"bonus" + :amt' })
                    .setParameter('amt', order.price)
                    .where('id = :id', { id: order.userId })
                    .execute();
            }
            order.status = 'rejected';
            await em.save(order);

            price = order.price;
            const [user, gift] = await Promise.all([
                em.findOne(User, { where: { id: order.userId } }),
                order.giftId ? em.findOne(Gift, { where: { id: order.giftId } }) : Promise.resolve(null),
            ]);
            notifyTelegramId = user?.telegramId;
            title = gift?.title ?? 'sovg\'a';
        });

        await this.notify(notifyTelegramId,
            `❌ "${title}" sovg'a so'rovingiz rad etildi.\n💰 +${price} bonus hisobingizga qaytarildi.`);
    }

    async setDelivered(id: number, delivered: boolean): Promise<void> {
        const order = await this.giftPurchaseRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Buyurtma topilmadi');
        order.delivered = delivered;
        await this.giftPurchaseRepo.save(order);
    }

    /** Yozuvni o'chirish (tarixdan; bonus o'zgartirilmaydi). */
    async delete(id: number): Promise<void> {
        const order = await this.giftPurchaseRepo.findOne({ where: { id } });
        if (!order) throw new NotFoundException('Buyurtma topilmadi');
        await this.giftPurchaseRepo.remove(order);
    }

    private async getSetting(key: string): Promise<string> {
        try {
            const rows = await this.dataSource.query(
                'SELECT "value" FROM "app_settings" WHERE "key" = $1', [key],
            );
            return rows[0]?.value ?? '';
        } catch { return ''; }
    }

    private async notify(telegramId: number | undefined, text: string): Promise<void> {
        if (!telegramId) return;
        try {
            await this.bot.telegram.sendMessage(telegramId, text);
        } catch (err) {
            this.logger.warn(`Telegram xabar yuborilmadi (${telegramId}): ${(err as Error).message}`);
        }
    }
}
