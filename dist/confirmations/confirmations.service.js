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
var ConfirmationsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.ConfirmationsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const typeorm_2 = require("typeorm");
const purchase_entity_1 = require("../common/entities/purchase.entity");
const user_entity_1 = require("../common/entities/user.entity");
const product_entity_1 = require("../common/entities/product.entity");
const code_entity_1 = require("../common/entities/code.entity");
let ConfirmationsService = ConfirmationsService_1 = class ConfirmationsService {
    purchaseRepo;
    userRepo;
    codeRepo;
    bot;
    dataSource;
    logger = new common_1.Logger(ConfirmationsService_1.name);
    constructor(purchaseRepo, userRepo, codeRepo, bot, dataSource) {
        this.purchaseRepo = purchaseRepo;
        this.userRepo = userRepo;
        this.codeRepo = codeRepo;
        this.bot = bot;
        this.dataSource = dataSource;
    }
    async counts() {
        const [pending, approved, rejected] = await Promise.all([
            this.purchaseRepo.count({ where: { status: 'pending' } }),
            this.purchaseRepo.count({ where: { status: 'approved' } }),
            this.purchaseRepo.count({ where: { status: 'rejected' } }),
        ]);
        return { pending, approved, rejected, total: pending + approved + rejected };
    }
    async pendingCount() {
        return this.purchaseRepo.count({ where: { status: 'pending' } });
    }
    async list(status, page = 1, limit = 20) {
        const st = status === 'all' ||
            purchase_entity_1.PURCHASE_STATUSES.includes(status ?? '')
            ? status
            : 'pending';
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(5, Number(limit) || 20));
        const skip = (page - 1) * limit;
        const where = st === 'all' ? {} : { status: st };
        const [rows, total, counts] = await Promise.all([
            this.purchaseRepo.find({
                where,
                order: { createdAt: 'DESC' },
                skip,
                take: limit,
                relations: ['user', 'product'],
            }),
            this.purchaseRepo.count({ where }),
            this.counts(),
        ]);
        const items = rows.map((r) => ({
            id: r.id,
            bonus: r.bonus ?? 0,
            quantity: r.quantity ?? 1,
            status: r.status ?? 'pending',
            reviewSubmitted: !!r.reviewSubmitted,
            proofImage: r.proofImage ?? '',
            reviewNote: r.reviewNote ?? '',
            reviewedAt: r.reviewedAt ?? null,
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
            product: r.product
                ? {
                    id: r.product.id,
                    title: r.product.title ?? '',
                    uzum_url: r.product.uzum_url ?? '',
                }
                : null,
        }));
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            items,
            total,
            page,
            limit,
            totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
            prevPage: Math.max(1, page - 1),
            nextPage: Math.min(totalPages, page + 1),
            status: st,
            counts,
        };
    }
    async delete(id) {
        const purchase = await this.purchaseRepo.findOne({ where: { id } });
        if (!purchase)
            throw new common_1.NotFoundException('Yozuv topilmadi');
        await this.purchaseRepo.remove(purchase);
    }
    async setStatus(id, status, reviewNote = '') {
        const purchase = await this.purchaseRepo.findOne({ where: { id } });
        if (!purchase)
            throw new common_1.NotFoundException('Yozuv topilmadi');
        purchase.status = status;
        purchase.reviewedAt = new Date();
        purchase.reviewNote = reviewNote;
        return this.purchaseRepo.save(purchase);
    }
    async notifyUser(telegramId, text) {
        if (!telegramId)
            return;
        try {
            await this.bot.telegram.sendMessage(telegramId, text);
        }
        catch (err) {
            this.logger.error(`Telegram xabar yuborilmadi (${telegramId}): ${err.message}`);
        }
    }
    async approve(id) {
        let notifyTelegramId;
        let notifyText = '';
        const updated = await this.dataSource.transaction(async (em) => {
            const purchase = await em.findOne(purchase_entity_1.Purchase, {
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!purchase)
                throw new common_1.NotFoundException('Yozuv topilmadi');
            const alreadyApproved = purchase.status === 'approved';
            if (!alreadyApproved && purchase.bonus > 0) {
                await em.increment(user_entity_1.User, { id: purchase.userId }, 'bonus', purchase.bonus);
            }
            purchase.status = 'approved';
            purchase.reviewedAt = new Date();
            const saved = await em.save(purchase);
            if (!alreadyApproved) {
                const idsMatch = (purchase.reviewNote ?? '').match(/\[ids:([\d,]+)\]/);
                if (idsMatch) {
                    const codeIds = idsMatch[1].split(',').map(Number).filter(Boolean);
                    if (codeIds.length > 0) {
                        await em.createQueryBuilder()
                            .update(code_entity_1.Code)
                            .set({ isUsed: true, usedByUserId: purchase.userId, usedAt: () => 'now()' })
                            .where('id IN (:...ids) AND "isUsed" = false', { ids: codeIds })
                            .execute();
                    }
                }
            }
            if (!alreadyApproved) {
                const [user, product] = await Promise.all([
                    em.findOne(user_entity_1.User, { where: { id: purchase.userId } }),
                    purchase.productId
                        ? em.findOne(product_entity_1.Product, { where: { id: purchase.productId } })
                        : Promise.resolve(null),
                ]);
                notifyTelegramId = user?.telegramId;
                notifyText =
                    `✅ Tabriklaymiz! "${product?.title ?? 'mahsulot'}" uchun xaridingiz tasdiqlandi.\n` +
                        `🎉 +${purchase.bonus} bonus hisobingizga qo'shildi.\n` +
                        `💰 Joriy bonusingiz: ${user?.bonus ?? 0}`;
            }
            return saved;
        });
        await this.notifyUser(notifyTelegramId, notifyText);
        return updated;
    }
    async reject(id, note = '') {
        let notifyTelegramId;
        let notifyText = '';
        const updated = await this.dataSource.transaction(async (em) => {
            const purchase = await em.findOne(purchase_entity_1.Purchase, {
                where: { id },
                lock: { mode: 'pessimistic_write' },
            });
            if (!purchase)
                throw new common_1.NotFoundException('Yozuv topilmadi');
            const wasApproved = purchase.status === 'approved';
            const alreadyRejected = purchase.status === 'rejected';
            if (wasApproved && purchase.bonus > 0) {
                await em
                    .createQueryBuilder()
                    .update(user_entity_1.User)
                    .set({ bonus: () => 'GREATEST("bonus" - :amt, 0)' })
                    .setParameter('amt', purchase.bonus)
                    .where('id = :id', { id: purchase.userId })
                    .execute();
            }
            purchase.status = 'rejected';
            purchase.reviewedAt = new Date();
            purchase.reviewNote = note;
            const saved = await em.save(purchase);
            if (!alreadyRejected) {
                const [user, product] = await Promise.all([
                    em.findOne(user_entity_1.User, { where: { id: purchase.userId } }),
                    purchase.productId
                        ? em.findOne(product_entity_1.Product, { where: { id: purchase.productId } })
                        : Promise.resolve(null),
                ]);
                notifyTelegramId = user?.telegramId;
                notifyText =
                    `❌ "${product?.title ?? 'mahsulot'}" uchun xaridingiz rad etildi.\n` +
                        `Bonus hisobingizga qo'shilmadi.`;
                if (note)
                    notifyText += `\n📝 Sabab: ${note}`;
            }
            return saved;
        });
        await this.notifyUser(notifyTelegramId, notifyText);
        return updated;
    }
};
exports.ConfirmationsService = ConfirmationsService;
exports.ConfirmationsService = ConfirmationsService = ConfirmationsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(1, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(2, (0, typeorm_1.InjectRepository)(code_entity_1.Code)),
    __param(3, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        telegraf_1.Telegraf,
        typeorm_2.DataSource])
], ConfirmationsService);
//# sourceMappingURL=confirmations.service.js.map