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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GiftsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const gift_entity_1 = require("../common/entities/gift.entity");
let GiftsService = class GiftsService {
    giftRepo;
    dataSource;
    constructor(giftRepo, dataSource) {
        this.giftRepo = giftRepo;
        this.dataSource = dataSource;
    }
    async list(q, page = 1, limit = 20) {
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(5, Number(limit) || 20));
        const skip = (page - 1) * limit;
        const where = q?.trim() ? { title: (0, typeorm_2.ILike)(`%${q.trim()}%`) } : {};
        const [items, total] = await this.giftRepo.findAndCount({
            where,
            order: { createdAt: 'DESC' },
            skip,
            take: limit,
        });
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
            q: q?.trim() ?? '',
        };
    }
    async findById(id) {
        const item = await this.giftRepo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Gift topilmadi');
        return item;
    }
    normalize(dto, requireAll) {
        const payload = {};
        if (dto.title !== undefined)
            payload.title = String(dto.title).trim();
        if (dto.image !== undefined)
            payload.image = String(dto.image).trim();
        if (dto.price !== undefined) {
            const num = Number(dto.price);
            if (Number.isNaN(num) || num < 0.1) {
                throw new common_1.BadRequestException("Narx 0.1 dan katta bo'lishi kerak");
            }
            if (num > 100) {
                throw new common_1.BadRequestException("Narx eng ko'pi 100 bo'lishi mumkin");
            }
            payload.price = num;
        }
        if (requireAll) {
            if (!payload.title)
                throw new common_1.BadRequestException('title majburiy');
            if (!payload.image)
                throw new common_1.BadRequestException('image majburiy');
            if (payload.price === undefined)
                throw new common_1.BadRequestException('price majburiy');
        }
        else {
            if ('title' in payload && !payload.title)
                throw new common_1.BadRequestException("title bo'sh bo'lmasligi kerak");
            if ('image' in payload && !payload.image)
                throw new common_1.BadRequestException("image bo'sh bo'lmasligi kerak");
        }
        return payload;
    }
    async create(dto) {
        const payload = this.normalize(dto, true);
        const gift = this.giftRepo.create(payload);
        return this.giftRepo.save(gift);
    }
    async update(id, dto) {
        const existing = await this.giftRepo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Gift topilmadi');
        const payload = this.normalize(dto, false);
        Object.assign(existing, payload);
        return this.giftRepo.save(existing);
    }
    async remove(id) {
        const item = await this.giftRepo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Gift topilmadi');
        await this.giftRepo.remove(item);
        return item;
    }
    async count() {
        return this.giftRepo.count();
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
    async setSetting(key, value) {
        await this.dataSource.query(`INSERT INTO "app_settings" ("key","value") VALUES ($1,$2)
             ON CONFLICT ("key") DO UPDATE SET "value"=EXCLUDED."value"`, [key, value]);
    }
};
exports.GiftsService = GiftsService;
exports.GiftsService = GiftsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(gift_entity_1.Gift)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.DataSource])
], GiftsService);
//# sourceMappingURL=gifts.service.js.map