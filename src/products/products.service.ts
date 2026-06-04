import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, ILike } from 'typeorm';
import { Product } from '../common/entities/product.entity';

export interface ProductDto {
    title?: string;
    image?: string;
    uzum_url?: string;
    bonus?: number | string;
    telegramChannel?: string;
    instagram?: string;
    requireChannel?: boolean | string;
}

@Injectable()
export class ProductsService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepo: Repository<Product>,
    ) {}

    async list(q?: string, page = 1, limit = 20) {
        page = Math.max(1, Number(page) || 1);
        limit = Math.min(100, Math.max(5, Number(limit) || 20));
        const skip = (page - 1) * limit;
        const where = q?.trim() ? { title: ILike(`%${q.trim()}%`) } : {};
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

    async findById(id: number) {
        const item = await this.productRepo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Mahsulot topilmadi');
        return item;
    }

    private normalize(dto: ProductDto, requireAll: boolean) {
        const payload: Partial<Product> = {};

        if (dto.title !== undefined) payload.title = String(dto.title).trim();
        if (dto.image !== undefined) payload.image = String(dto.image).trim();
        if (dto.uzum_url !== undefined) payload.uzum_url = String(dto.uzum_url).trim();
        if (dto.telegramChannel !== undefined) payload.telegramChannel = String(dto.telegramChannel).trim();
        if (dto.instagram !== undefined) payload.instagram = String(dto.instagram).trim();

        // requireChannel: checkbox html '1' yoki 'on' yuboradi
        if (dto.requireChannel !== undefined) {
            payload.requireChannel = dto.requireChannel === true
                || dto.requireChannel === 'on'
                || dto.requireChannel === '1'
                || dto.requireChannel === 'true';
        }

        if (dto.bonus !== undefined) {
            const num = Number(dto.bonus);
            if (Number.isNaN(num) || !Number.isInteger(num) || num < 0) {
                throw new BadRequestException("Bonus musbat butun son bo'lishi kerak");
            }
            if (num > 100) {
                throw new BadRequestException('Bonus eng ko\'pi 100 bo\'lishi mumkin');
            }
            payload.bonus = num;
        }

        if (requireAll) {
            if (!payload.title) throw new BadRequestException('title majburiy');
            if (!payload.uzum_url) throw new BadRequestException('uzum_url majburiy');
            if (payload.bonus === undefined) throw new BadRequestException('bonus majburiy');
        } else {
            if ('title' in payload && !payload.title) throw new BadRequestException("title bo'sh bo'lmasligi kerak");
            if ('uzum_url' in payload && !payload.uzum_url) throw new BadRequestException("uzum_url bo'sh bo'lmasligi kerak");
        }
        return payload;
    }

    async create(dto: ProductDto) {
        const payload = this.normalize(dto, true);
        const product = this.productRepo.create(payload);
        return this.productRepo.save(product);
    }

    async update(id: number, dto: ProductDto) {
        const existing = await this.productRepo.findOne({ where: { id } });
        if (!existing) throw new NotFoundException('Mahsulot topilmadi');
        const payload = this.normalize(dto, false);
        Object.assign(existing, payload);
        return this.productRepo.save(existing);
    }

    async remove(id: number) {
        const item = await this.productRepo.findOne({ where: { id } });
        if (!item) throw new NotFoundException('Mahsulot topilmadi');
        await this.productRepo.remove(item);
        return item;
    }

    async count() {
        return this.productRepo.count();
    }

    /** Oxirgi 30 kun ichida eng ko'p sotilgan (tasdiqlangan) mahsulotlar top 10. */
    async topSoldProducts(): Promise<{ id: number; title: string; sold: number; bonusTotal: number }[]> {
        const rows = await this.productRepo
            .createQueryBuilder('pr')
            .innerJoin(
                'purchases', 'p',
                'p."productId" = pr.id AND p.status = :status AND p."createdAt" >= NOW() - INTERVAL \'30 days\'',
                { status: 'approved' },
            )
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
            title: r.title as string,
            sold: Number(r.sold),
            bonusTotal: Number(r.bonusTotal),
        }));
    }

    /** Oxirgi 30 kun ichida kunlik sotilgan mahsulotlar grafigi. */
    async dailySalesStats(): Promise<{ day: string; count: number; bonusTotal: number }[]> {
        const rows = await this.productRepo
            .createQueryBuilder('pr')
            .innerJoin(
                'purchases', 'p',
                'p."productId" = pr.id AND p.status = :status AND p."createdAt" >= NOW() - INTERVAL \'30 days\'',
                { status: 'approved' },
            )
            .select("TO_CHAR((p.\"createdAt\" AT TIME ZONE 'Asia/Tashkent')::date, 'YYYY-MM-DD')", 'day')
            .addSelect('COUNT(p.id)', 'count')
            .addSelect('SUM(p.bonus)', 'bonusTotal')
            .groupBy("TO_CHAR((p.\"createdAt\" AT TIME ZONE 'Asia/Tashkent')::date, 'YYYY-MM-DD')")
            .orderBy('day', 'ASC')
            .getRawMany();
        return rows.map(r => ({
            day: r.day as string,
            count: Number(r.count),
            bonusTotal: Number(r.bonusTotal),
        }));
    }
}
