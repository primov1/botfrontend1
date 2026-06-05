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
var CodesService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.CodesService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const node_crypto_1 = require("node:crypto");
const code_entity_1 = require("../common/entities/code.entity");
const product_entity_1 = require("../common/entities/product.entity");
const ALPHANUM = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 7;
const MAX_COUNT = 10000;
const EXPIRY_MONTHS = 12;
let CodesService = CodesService_1 = class CodesService {
    codeRepo;
    productRepo;
    dataSource;
    logger = new common_1.Logger(CodesService_1.name);
    constructor(codeRepo, productRepo, dataSource) {
        this.codeRepo = codeRepo;
        this.productRepo = productRepo;
        this.dataSource = dataSource;
    }
    async onModuleInit() {
        try {
            await this.dataSource.query(`CREATE TABLE IF NOT EXISTS "codes" (
                    "id" SERIAL PRIMARY KEY,
                    "code" varchar NOT NULL,
                    "productId" int NOT NULL,
                    "points" int NOT NULL DEFAULT 0,
                    "isUsed" boolean NOT NULL DEFAULT false,
                    "usedByUserId" int,
                    "usedAt" timestamptz,
                    "expiresAt" timestamptz NOT NULL,
                    "createdAt" timestamptz NOT NULL DEFAULT now()
                )`);
            await this.dataSource.query('CREATE UNIQUE INDEX IF NOT EXISTS "UQ_codes_code" ON "codes"("code")');
            await this.dataSource.query('CREATE INDEX IF NOT EXISTS "IDX_codes_product" ON "codes"("productId")');
        }
        catch (err) {
            this.logger.warn(`codes jadvalini tayyorlab bo'lmadi: ${err.message}`);
        }
    }
    randomCode() {
        let s = '';
        for (let i = 0; i < CODE_LENGTH; i++)
            s += ALPHANUM[(0, node_crypto_1.randomInt)(ALPHANUM.length)];
        return s;
    }
    async generateCodes(productId, count) {
        if (!Number.isInteger(count) || count < 1 || count > MAX_COUNT) {
            throw new common_1.BadRequestException(`Miqdor 1 dan ${MAX_COUNT} gacha butun son bo'lishi kerak`);
        }
        let points = 0;
        if (productId && productId > 0) {
            const product = await this.productRepo.findOne({ where: { id: productId } });
            if (!product)
                throw new common_1.NotFoundException('Mahsulot topilmadi');
            points = product.bonus;
        }
        else {
            productId = 0;
        }
        const set = new Set();
        while (set.size < count)
            set.add(this.randomCode());
        let candidates = [...set];
        const existing = await this.codeRepo.find({ where: { code: (0, typeorm_2.In)(candidates) }, select: ['code'] });
        if (existing.length) {
            const taken = new Set(existing.map((e) => e.code));
            const finalSet = new Set(candidates.filter((c) => !taken.has(c)));
            while (finalSet.size < count) {
                const c = this.randomCode();
                if (!taken.has(c))
                    finalSet.add(c);
            }
            candidates = [...finalSet];
        }
        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + EXPIRY_MONTHS);
        const rows = candidates.map((code) => ({
            code, productId, points, isUsed: false, expiresAt,
        }));
        await this.codeRepo
            .createQueryBuilder()
            .insert()
            .into(code_entity_1.Code)
            .values(rows)
            .execute();
        return { count: rows.length, codes: candidates };
    }
    async list(filter, page = 1, limit = 50) {
        const qb = this.codeRepo.createQueryBuilder('c').orderBy('c.createdAt', 'DESC');
        if (filter.productId)
            qb.andWhere('c."productId" = :pid', { pid: filter.productId });
        if (filter.isUsed !== undefined)
            qb.andWhere('c."isUsed" = :u', { u: filter.isUsed });
        if (filter.expired === true)
            qb.andWhere('c."expiresAt" < now()');
        if (filter.expired === false)
            qb.andWhere('c."expiresAt" >= now()');
        const total = await qb.getCount();
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const items = await qb.skip((safePage - 1) * limit).take(limit).getMany();
        return { items, total, page: safePage, totalPages, limit };
    }
    async exportToCsv(productId) {
        const product = await this.productRepo.findOne({ where: { id: productId } });
        const codes = await this.codeRepo.find({ where: { productId }, order: { createdAt: 'ASC' } });
        const esc = (v) => `"${String(v).replace(/"/g, '""')}"`;
        const fmt = (d) => new Date(d).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
        const header = ['Kod', 'Mahsulot', 'Ball', 'Yaratilgan', 'Muddat'].map(esc).join(',');
        const lines = codes.map((c) => [c.code, product?.title ?? '', String(c.points), fmt(c.createdAt), fmt(c.expiresAt)].map(esc).join(','));
        const content = '﻿' + [header, ...lines].join('\r\n');
        return { filename: `codes_${product?.title ?? productId}_${Date.now()}.csv`, content };
    }
    async validateCode(code) {
        const found = await this.codeRepo.findOne({ where: { code: (code ?? '').trim().toUpperCase() } });
        if (!found)
            return null;
        if (found.isUsed)
            return null;
        if (new Date(found.expiresAt).getTime() < Date.now())
            return null;
        return found;
    }
    async markAsUsed(codeId, userId) {
        const res = await this.codeRepo
            .createQueryBuilder()
            .update(code_entity_1.Code)
            .set({ isUsed: true, usedByUserId: userId, usedAt: () => 'now()' })
            .where('id = :id AND "isUsed" = false', { id: codeId })
            .execute();
        return (res.affected ?? 0) > 0;
    }
    async deleteUnused(id) {
        const code = await this.codeRepo.findOne({ where: { id } });
        if (!code)
            throw new common_1.NotFoundException('Kod topilmadi');
        if (code.isUsed)
            throw new common_1.BadRequestException("Ishlatilgan kodni o'chirib bo'lmaydi");
        await this.codeRepo.remove(code);
    }
    async stats(productId) {
        const [total, used] = await Promise.all([
            this.codeRepo.count({ where: { productId } }),
            this.codeRepo.count({ where: { productId, isUsed: true } }),
        ]);
        return { total, used, unused: total - used };
    }
    findById(id) {
        return this.codeRepo.findOne({ where: { id } });
    }
    STICKER_KEY = 'sticker_text';
    STICKER_DEFAULT = "Sotib oling va bonuslarga ega bo'ling!";
    async getStickerText() {
        try {
            const rows = await this.dataSource.query('SELECT "value" FROM "app_settings" WHERE "key" = $1', [this.STICKER_KEY]);
            return rows[0]?.value || this.STICKER_DEFAULT;
        }
        catch {
            return this.STICKER_DEFAULT;
        }
    }
    async setStickerText(text) {
        await this.setSetting(this.STICKER_KEY, (text ?? '').slice(0, 200));
    }
    BOTNICK_KEY = 'bot_username';
    async getBotUsername() {
        const v = await this.getSetting(this.BOTNICK_KEY);
        return (v || process.env.BOT_USERNAME || '').replace(/^@/, '');
    }
    async setBotUsername(nick) {
        await this.setSetting(this.BOTNICK_KEY, (nick ?? '').replace(/^@/, '').trim().slice(0, 64));
    }
    async getSetting(key) {
        try {
            const rows = await this.dataSource.query('SELECT "value" FROM "app_settings" WHERE "key" = $1', [key]);
            return rows[0]?.value || '';
        }
        catch {
            return '';
        }
    }
    async setSetting(key, value) {
        await this.dataSource.query(`INSERT INTO "app_settings" ("key", "value") VALUES ($1, $2)
             ON CONFLICT ("key") DO UPDATE SET "value" = EXCLUDED."value"`, [key, value]);
    }
};
exports.CodesService = CodesService;
exports.CodesService = CodesService = CodesService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(code_entity_1.Code)),
    __param(1, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource])
], CodesService);
//# sourceMappingURL=codes.service.js.map