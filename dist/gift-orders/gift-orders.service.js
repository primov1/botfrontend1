"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var GiftOrdersService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftOrdersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const typeorm_2 = require("typeorm");
const gift_purchase_entity_1 = require("../common/entities/gift-purchase.entity");
const user_entity_1 = require("../common/entities/user.entity");
const gift_entity_1 = require("../common/entities/gift.entity");
let GiftOrdersService = GiftOrdersService_1 = class GiftOrdersService {
    giftPurchaseRepo;
    bot;
    dataSource;
    logger = new common_1.Logger(GiftOrdersService_1.name);
    constructor(giftPurchaseRepo, bot, dataSource) {
        this.giftPurchaseRepo = giftPurchaseRepo;
        this.bot = bot;
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        for (const sql of [
            'ALTER TABLE "gift_purchases" ADD COLUMN IF NOT EXISTS "delivered" boolean NOT NULL DEFAULT false',
            `ALTER TABLE "gift_purchases" ADD COLUMN IF NOT EXISTS "status" varchar NOT NULL DEFAULT 'pending'`,
        ]) {
            try {
                await this.dataSource.query(sql);
            }
            catch (err) {
                this.logger.warn(`gift_purchases ustun: ${err.message}`);
            }
        }
    }
    async pendingCount() {
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
    async list(page = 1, limit = 20, filter = 'pending') {
        page = Math.max(1, Math.floor(page) || 1);
        limit = Math.min(100, Math.max(5, Math.floor(limit) || 20));
        const where = filter === 'all' ? {} : { status: filter };
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
    async approve(id) {
        let notifyTelegramId;
        let title = '';
        await this.dataSource.transaction(async (em) => {
            const order = await em.findOne(gift_purchase_entity_1.GiftPurchase, { where: { id }, lock: { mode: 'pessimistic_write' } });
            if (!order)
                throw new common_1.NotFoundException('Buyurtma topilmadi');
            if (order.status === 'approved')
                return;
            order.status = 'approved';
            await em.save(order);
            const [user, gift] = await Promise.all([
                em.findOne(user_entity_1.User, { where: { id: order.userId } }),
                order.giftId ? em.findOne(gift_entity_1.Gift, { where: { id: order.giftId } }) : Promise.resolve(null),
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
            if (adminPhone)
                contactLine += `\n📱 Tel: ${adminPhone}`;
            if (adminTg)
                contactLine += `\n✈️ Telegram: @${adminTg.replace(/^@/, '')}`;
        }
        await this.notify(notifyTelegramId, `✅ Tabriklaymiz! "${title}" sovg'angiz tasdiqlandi.${contactLine}`);
    }
    async reject(id) {
        let notifyTelegramId;
        let title = '';
        let price = 0;
        await this.dataSource.transaction(async (em) => {
            const order = await em.findOne(gift_purchase_entity_1.GiftPurchase, { where: { id }, lock: { mode: 'pessimistic_write' } });
            if (!order)
                throw new common_1.NotFoundException('Buyurtma topilmadi');
            if (order.status === 'rejected')
                return;
            if (order.price > 0) {
                await em.createQueryBuilder()
                    .update(user_entity_1.User)
                    .set({ bonus: () => '"bonus" + :amt' })
                    .setParameter('amt', order.price)
                    .where('id = :id', { id: order.userId })
                    .execute();
            }
            order.status = 'rejected';
            await em.save(order);
            price = order.price;
            const [user, gift] = await Promise.all([
                em.findOne(user_entity_1.User, { where: { id: order.userId } }),
                order.giftId ? em.findOne(gift_entity_1.Gift, { where: { id: order.giftId } }) : Promise.resolve(null),
            ]);
            notifyTelegramId = user?.telegramId;
            title = gift?.title ?? 'sovg\'a';
        });
        await this.notify(notifyTelegramId, `❌ "${title}" sovg'a so'rovingiz rad etildi.\n💰 +${price} bonus hisobingizga qaytarildi.`);
    }
    async setDelivered(id, delivered) {
        const order = await this.giftPurchaseRepo.findOne({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Buyurtma topilmadi');
        order.delivered = delivered;
        await this.giftPurchaseRepo.save(order);
    }
    async delete(id) {
        const order = await this.giftPurchaseRepo.findOne({ where: { id } });
        if (!order)
            throw new common_1.NotFoundException('Buyurtma topilmadi');
        await this.giftPurchaseRepo.remove(order);
    }
    async getSetting(key) {
        try {
            const rows = await this.dataSource.query('SELECT "value" FROM "app_settings" WHERE "key" = $1', [key]);
            return rows[0]?.value ?? '';
        }
        catch {
            return '';
        }
    }
    async notify(telegramId, text) {
        if (!telegramId)
            return;
        try {
            await this.bot.telegram.sendMessage(telegramId, text);
        }
        catch (err) {
            this.logger.warn(`Telegram xabar yuborilmadi (${telegramId}): ${err.message}`);
        }
    }
};
exports.GiftOrdersService = GiftOrdersService;
exports.GiftOrdersService = GiftOrdersService = GiftOrdersService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gift_purchase_entity_1.GiftPurchase)),
    __param(1, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        telegraf_1.Telegraf,
        typeorm_2.DataSource])
], GiftOrdersService);
//# sourceMappingURL=gift-orders.service.js.map