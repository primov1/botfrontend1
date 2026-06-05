"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.UsersService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const ExcelJS = __importStar(require("exceljs"));
const user_entity_1 = require("../common/entities/user.entity");
const purchase_entity_1 = require("../common/entities/purchase.entity");
const gift_purchase_entity_1 = require("../common/entities/gift-purchase.entity");
let UsersService = class UsersService {
    userRepo;
    purchaseRepo;
    giftPurchaseRepo;
    dataSource;
    constructor(userRepo, purchaseRepo, giftPurchaseRepo, dataSource) {
        this.userRepo = userRepo;
        this.purchaseRepo = purchaseRepo;
        this.giftPurchaseRepo = giftPurchaseRepo;
        this.dataSource = dataSource;
    }
    async list(query) {
        const page = Math.max(1, Number(query.page) || 1);
        const limit = Math.min(100, Math.max(5, Number(query.limit) || 20));
        const skip = (page - 1) * limit;
        const term = (query.q ?? '').trim();
        const where = term
            ? [
                { firstName: (0, typeorm_2.ILike)(`%${term}%`) },
                { lastName: (0, typeorm_2.ILike)(`%${term}%`) },
                { phone: (0, typeorm_2.ILike)(`%${term}%`) },
            ]
            : {};
        const [items, total] = await this.userRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            items, total, page, limit, totalPages,
            hasPrev: page > 1,
            hasNext: page < totalPages,
            prevPage: Math.max(1, page - 1),
            nextPage: Math.min(totalPages, page + 1),
            q: term,
        };
    }
    async findById(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User topilmadi');
        return user;
    }
    async update(id, dto) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User topilmadi');
        if (typeof dto.firstName === 'string')
            user.firstName = dto.firstName.trim();
        if (typeof dto.lastName === 'string')
            user.lastName = dto.lastName.trim();
        if (typeof dto.phone === 'string')
            user.phone = dto.phone.trim();
        return this.userRepo.save(user);
    }
    async delete(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User topilmadi');
        await this.dataSource.transaction(async (em) => {
            await em.delete(purchase_entity_1.Purchase, { userId: id });
            await em.delete(gift_purchase_entity_1.GiftPurchase, { userId: id });
            await em.remove(user);
        });
    }
    async count() {
        return this.userRepo.count();
    }
    async registrationStats() {
        const rows = await this.userRepo
            .createQueryBuilder('u')
            .select("TO_CHAR((u.\"createdAt\" AT TIME ZONE 'Asia/Tashkent')::date, 'YYYY-MM-DD')", 'day')
            .addSelect('COUNT(*)', 'count')
            .where("u.\"createdAt\" >= NOW() - INTERVAL '30 days'")
            .groupBy("TO_CHAR((u.\"createdAt\" AT TIME ZONE 'Asia/Tashkent')::date, 'YYYY-MM-DD')")
            .orderBy('day', 'ASC')
            .getRawMany();
        return rows.map(r => ({ day: r.day, count: Number(r.count) }));
    }
    async topBonusUsers() {
        const rows = await this.userRepo
            .createQueryBuilder('u')
            .leftJoin('purchases', 'p', 'p."userId" = u.id AND p.status = :status', { status: 'approved' })
            .select('u.id', 'id')
            .addSelect("COALESCE(u.\"firstName\", '') || ' ' || COALESCE(u.\"lastName\", '')", 'name')
            .addSelect('u.bonus', 'bonus')
            .addSelect('COUNT(p.id)', 'orders')
            .groupBy('u.id')
            .orderBy('u.bonus', 'DESC')
            .limit(10)
            .getRawMany();
        return rows.map(r => ({
            id: Number(r.id),
            name: r.name.trim() || 'Nomsiz',
            bonus: Number(r.bonus),
            orders: Number(r.orders),
        }));
    }
    async exportExcel(q) {
        const term = (q ?? '').trim();
        const where = term
            ? [
                { firstName: (0, typeorm_2.ILike)(`%${term}%`) },
                { lastName: (0, typeorm_2.ILike)(`%${term}%`) },
                { phone: (0, typeorm_2.ILike)(`%${term}%`) },
            ]
            : {};
        const users = await this.userRepo.find({ where, order: { createdAt: 'DESC' } });
        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet('Foydalanuvchilar');
        sheet.columns = [
            { header: '#', key: 'num', width: 6 },
            { header: 'Ism', key: 'firstName', width: 20 },
            { header: 'Familiya', key: 'lastName', width: 20 },
            { header: 'Telefon', key: 'phone', width: 18 },
            { header: 'Username', key: 'username', width: 20 },
            { header: 'Bonus', key: 'bonus', width: 10 },
            { header: 'Sana', key: 'createdAt', width: 20 },
        ];
        sheet.getRow(1).font = { bold: true };
        users.forEach((u, i) => {
            sheet.addRow({
                num: i + 1,
                firstName: u.firstName || '',
                lastName: u.lastName || '',
                phone: u.phone || '',
                username: u.username ? `@${u.username}` : '',
                bonus: u.bonus ?? 0,
                createdAt: u.createdAt ? new Date(u.createdAt).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' }) : '',
            });
        });
        return workbook.xlsx.writeBuffer();
    }
    async profile(id) {
        const user = await this.userRepo.findOne({ where: { id } });
        if (!user)
            throw new common_1.NotFoundException('User topilmadi');
        const [purchases, giftPurchases] = await Promise.all([
            this.purchaseRepo.find({
                where: { userId: id },
                order: { createdAt: 'DESC' },
                relations: ['product'],
            }),
            this.giftPurchaseRepo.find({
                where: { userId: id },
                order: { createdAt: 'DESC' },
                relations: ['gift'],
            }),
        ]);
        const purchaseRows = purchases.map((p) => ({
            id: p.id, bonus: p.bonus ?? 0, quantity: p.quantity ?? 1, status: p.status ?? 'pending',
            reviewSubmitted: !!p.reviewSubmitted, proofImage: p.proofImage ?? '',
            reviewComment: p.reviewComment ?? '', reviewNote: p.reviewNote ?? '',
            reviewedAt: p.reviewedAt ?? null, createdAt: p.createdAt,
            product: p.product ? {
                id: p.product.id, title: p.product.title,
                uzum_url: p.product.uzum_url, bonus: p.product.bonus,
            } : null,
        }));
        const giftRows = giftPurchases.map((g) => ({
            id: g.id, price: g.price ?? 0, createdAt: g.createdAt,
            gift: g.gift ? {
                id: g.gift.id, title: g.gift.title,
                image: g.gift.image, price: g.gift.price,
            } : null,
        }));
        const totalBonusEarned = purchaseRows.filter((r) => r.status === 'approved').reduce((acc, r) => acc + (Number(r.bonus) || 0), 0);
        const totalBonusPending = purchaseRows.filter((r) => r.status === 'pending').reduce((acc, r) => acc + (Number(r.bonus) || 0), 0);
        const totalBonusSpent = giftRows.reduce((acc, r) => acc + (Number(r.price) || 0), 0);
        const pendingCount = purchaseRows.filter((r) => r.status === 'pending').length;
        const approvedCount = purchaseRows.filter((r) => r.status === 'approved').length;
        const rejectedCount = purchaseRows.filter((r) => r.status === 'rejected').length;
        return {
            user, purchases: purchaseRows, giftPurchases: giftRows,
            totals: {
                purchases: purchaseRows.length, giftPurchases: giftRows.length,
                bonusEarned: totalBonusEarned, bonusPending: totalBonusPending,
                bonusSpent: totalBonusSpent, bonusBalance: totalBonusEarned - totalBonusSpent,
                pendingCount, approvedCount, rejectedCount,
            },
        };
    }
};
exports.UsersService = UsersService;
exports.UsersService = UsersService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, typeorm_1.InjectRepository)(purchase_entity_1.Purchase)),
    __param(2, (0, typeorm_1.InjectRepository)(gift_purchase_entity_1.GiftPurchase)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], UsersService);
//# sourceMappingURL=users.service.js.map