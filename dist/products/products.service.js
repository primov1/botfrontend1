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
exports.ProductsService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const product_entity_1 = require("../common/entities/product.entity");
let ProductsService = class ProductsService {
    productRepo;
    constructor(productRepo) {
        this.productRepo = productRepo;
    }
    async list(q, page = 1, limit = 20) {
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(5, Number(limit) || 20));
        const skip = (page - 1) * limit;
        const where = q?.trim() ? { title: (0, typeorm_2.ILike)(`%${q.trim()}%`) } : {};
        const [items, total] = await this.productRepo.findAndCount({
            where, order: { createdAt: 'DESC' }, skip, take: limit,
        });
        const totalPages = Math.max(1, Math.ceil(total / limit));
        return {
            items, total, page, limit, totalPages,
            hasPrev: page > 1, hasNext: page < totalPages,
            prevPage: Math.max(1, page - 1),
            nextPage: Math.min(totalPages, page + 1),
            q: q?.trim() ?? '',
        };
    }
    async findById(id) {
        const item = await this.productRepo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Mahsulot topilmadi');
        return item;
    }
    normalize(dto, requireAll) {
        const payload = {};
        if (dto.title !== undefined)
            payload.title = String(dto.title).trim();
        if (dto.image !== undefined)
            payload.image = String(dto.image).trim();
        if (dto.uzum_url !== undefined)
            payload.uzum_url = String(dto.uzum_url).trim();
        if (dto.telegramChannel !== undefined)
            payload.telegramChannel = String(dto.telegramChannel).trim();
        if (dto.instagram !== undefined)
            payload.instagram = String(dto.instagram).trim();
        if (dto.requireChannel !== undefined) {
            payload.requireChannel = dto.requireChannel === true
                || dto.requireChannel === 'on'
                || dto.requireChannel === '1'
                || dto.requireChannel === 'true';
        }
        if (dto.bonus !== undefined) {
            const num = Number(dto.bonus);
            if (Number.isNaN(num) || !Number.isInteger(num) || num < 0) {
                throw new common_1.BadRequestException("Bonus musbat butun son bo'lishi kerak");
            }
            if (num > 100) {
                throw new common_1.BadRequestException('Bonus eng ko\'pi 100 bo\'lishi mumkin');
            }
            payload.bonus = num;
        }
        if (requireAll) {
            if (!payload.title)
                throw new common_1.BadRequestException('title majburiy');
            if (!payload.uzum_url)
                throw new common_1.BadRequestException('uzum_url majburiy');
            if (payload.bonus === undefined)
                throw new common_1.BadRequestException('bonus majburiy');
        }
        else {
            if ('title' in payload && !payload.title)
                throw new common_1.BadRequestException("title bo'sh bo'lmasligi kerak");
            if ('uzum_url' in payload && !payload.uzum_url)
                throw new common_1.BadRequestException("uzum_url bo'sh bo'lmasligi kerak");
        }
        return payload;
    }
    async create(dto) {
        const payload = this.normalize(dto, true);
        const product = this.productRepo.create(payload);
        return this.productRepo.save(product);
    }
    async update(id, dto) {
        const existing = await this.productRepo.findOne({ where: { id } });
        if (!existing)
            throw new common_1.NotFoundException('Mahsulot topilmadi');
        const payload = this.normalize(dto, false);
        Object.assign(existing, payload);
        return this.productRepo.save(existing);
    }
    async remove(id) {
        const item = await this.productRepo.findOne({ where: { id } });
        if (!item)
            throw new common_1.NotFoundException('Mahsulot topilmadi');
        await this.productRepo.remove(item);
        return item;
    }
    async count() {
        return this.productRepo.count();
    }
    async topSoldProducts() {
        const rows = await this.productRepo
            .createQueryBuilder('pr')
            .innerJoin('purchases', 'p', 'p."productId" = pr.id AND p.status = :status AND p."createdAt" >= NOW() - INTERVAL \'30 days\'', { status: 'approved' })
            .select('pr.id', 'id')
            .addSelect('pr.title', 'title')
            .addSelect('COUNT(p.id)', 'sold')
            .addSelect('SUM(p.bonus)', 'bonusTotal')
            .groupBy('pr.id')
            .orderBy('sold', 'DESC')
            .limit(10)
            .getRawMany();
        return rows.map(r => ({
            id: Number(r.id),
            title: r.title,
            sold: Number(r.sold),
            bonusTotal: Number(r.bonusTotal),
        }));
    }
    async dailySalesStats() {
        const rows = await this.productRepo
            .createQueryBuilder('pr')
            .innerJoin('purchases', 'p', 'p."productId" = pr.id AND p.status = :status AND p."createdAt" >= NOW() - INTERVAL \'30 days\'', { status: 'approved' })
            .select("TO_CHAR((p.\"createdAt\" AT TIME ZONE 'Asia/Tashkent')::date, 'YYYY-MM-DD')", 'day')
            .addSelect('COUNT(p.id)', 'count')
            .addSelect('SUM(p.bonus)', 'bonusTotal')
            .groupBy("TO_CHAR((p.\"createdAt\" AT TIME ZONE 'Asia/Tashkent')::date, 'YYYY-MM-DD')")
            .orderBy('day', 'ASC')
            .getRawMany();
        return rows.map(r => ({
            day: r.day,
            count: Number(r.count),
            bonusTotal: Number(r.bonusTotal),
        }));
    }
};
exports.ProductsService = ProductsService;
exports.ProductsService = ProductsService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(product_entity_1.Product)),
    __metadata("design:paramtypes", [typeorm_2.Repository])
], ProductsService);
//# sourceMappingURL=products.service.js.map