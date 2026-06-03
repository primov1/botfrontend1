import { BadRequestException, Injectable, Logger, NotFoundException, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { randomInt } from 'node:crypto';
import { Code } from '../common/entities/code.entity';
import { Product } from '../common/entities/product.entity';

const ALPHANUM = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
const ALLOWED_COUNTS = [500, 1000, 1500, 2000];
const EXPIRY_MONTHS = 12;

export interface CodeFilter {
    productId?: number;
    isUsed?: boolean;
    expired?: boolean;
}

@Injectable()
export class CodesService implements OnModuleInit {
    private readonly logger = new Logger(CodesService.name);

    constructor(
        @InjectRepository(Code) private readonly codeRepo: Repository<Code>,
        @InjectRepository(Product) private readonly productRepo: Repository<Product>,
        private readonly dataSource: DataSource,
    ) {}

    async onModuleInit(): Promise<void> {
        try {
            await this.dataSource.query(
                `CREATE TABLE IF NOT EXISTS "codes" (
                    "id" SERIAL PRIMARY KEY,
                    "code" varchar NOT NULL,
                    "productId" int NOT NULL,
                    "points" int NOT NULL DEFAULT 0,
                    "isUsed" boolean NOT NULL DEFAULT false,
                    "usedByUserId" int,
                    "usedAt" timestamptz,
                    "expiresAt" timestamptz NOT NULL,
                    "createdAt" timestamptz NOT NULL DEFAULT now()
                )`,
            );
            await this.dataSource.query('CREATE UNIQUE INDEX IF NOT EXISTS "UQ_codes_code" ON "codes"("code")');
            await this.dataSource.query('CREATE INDEX IF NOT EXISTS "IDX_codes_product" ON "codes"("productId")');
        } catch (err) {
            this.logger.warn(`codes jadvalini tayyorlab bo'lmadi: ${(err as Error).message}`);
        }
    }

    private prefixFor(productId: number): string {
        return `P${productId}`;
    }

    private randomSuffix(): string {
        let s = '';
        for (let i = 0; i < 5; i++) s += ALPHANUM[randomInt(ALPHANUM.length)];
        return s;
    }

    /**
     * Batch kod yaratish — bitta INSERT so'rovi. Barcha kodlar unique
     * (DB va batch ichida tekshiriladi, to'qnashsa qayta generatsiya).
     */
    async generateCodes(productId: number, count: number): Promise<number> {
        if (!ALLOWED_COUNTS.includes(count)) {
            throw new BadRequestException(`Miqdor faqat ${ALLOWED_COUNTS.join(', ')} dan biri bo'lishi kerak`);
        }
        const product = await this.productRepo.findOne({ where: { id: productId } });
        if (!product) throw new NotFoundException('Mahsulot topilmadi');

        const prefix = this.prefixFor(productId);
        const set = new Set<string>();
        while (set.size < count) set.add(`${prefix}-${this.randomSuffix()}`);

        // DB'da mavjudlarini tekshirib, to'qnashganlarini qayta yaratamiz
        let candidates = [...set];
        const existing = await this.codeRepo.find({ where: { code: In(candidates) }, select: ['code'] });
        if (existing.length) {
            const taken = new Set(existing.map((e) => e.code));
            const finalSet = new Set(candidates.filter((c) => !taken.has(c)));
            while (finalSet.size < count) {
                const c = `${prefix}-${this.randomSuffix()}`;
                if (!taken.has(c)) finalSet.add(c);
            }
            candidates = [...finalSet];
        }

        const expiresAt = new Date();
        expiresAt.setMonth(expiresAt.getMonth() + EXPIRY_MONTHS);

        const rows = candidates.map((code) => ({
            code, productId, points: product.bonus, isUsed: false, expiresAt,
        }));

        // Bitta so'rovda batch insert (chunklab — pg parametr limitidan oshmaslik uchun)
        await this.codeRepo
            .createQueryBuilder()
            .insert()
            .into(Code)
            .values(rows)
            .execute();

        return rows.length;
    }

    async list(filter: CodeFilter, page = 1, limit = 50) {
        const qb = this.codeRepo.createQueryBuilder('c').orderBy('c.createdAt', 'DESC');
        if (filter.productId) qb.andWhere('c."productId" = :pid', { pid: filter.productId });
        if (filter.isUsed !== undefined) qb.andWhere('c."isUsed" = :u', { u: filter.isUsed });
        if (filter.expired === true) qb.andWhere('c."expiresAt" < now()');
        if (filter.expired === false) qb.andWhere('c."expiresAt" >= now()');

        const total = await qb.getCount();
        const totalPages = Math.max(1, Math.ceil(total / limit));
        const safePage = Math.min(Math.max(1, page), totalPages);
        const items = await qb.skip((safePage - 1) * limit).take(limit).getMany();

        return { items, total, page: safePage, totalPages, limit };
    }

    /** CSV: kod, mahsulot nomi, ball, yaratilgan sana, muddat */
    async exportToCsv(productId: number): Promise<{ filename: string; content: string }> {
        const product = await this.productRepo.findOne({ where: { id: productId } });
        const codes = await this.codeRepo.find({ where: { productId }, order: { createdAt: 'ASC' } });

        const esc = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
        const fmt = (d: Date) => new Date(d).toLocaleString('uz-UZ', { timeZone: 'Asia/Tashkent' });
        const header = ['Kod', 'Mahsulot', 'Ball', 'Yaratilgan', 'Muddat'].map(esc).join(',');
        const lines = codes.map((c) =>
            [c.code, product?.title ?? '', String(c.points), fmt(c.createdAt), fmt(c.expiresAt)].map(esc).join(','),
        );
        // BOM + CRLF (Excel'da kirilcha/lotin to'g'ri ko'rinishi uchun)
        const content = '﻿' + [header, ...lines].join('\r\n');
        return { filename: `codes_${product?.title ?? productId}_${Date.now()}.csv`, content };
    }

    /** Bot uchun: kod yaroqlimi (mavjud, ishlatilmagan, muddati o'tmagan). */
    async validateCode(code: string): Promise<Code | null> {
        const found = await this.codeRepo.findOne({ where: { code: (code ?? '').trim().toUpperCase() } });
        if (!found) return null;
        if (found.isUsed) return null;
        if (new Date(found.expiresAt).getTime() < Date.now()) return null;
        return found;
    }

    /** Ishlatilgan deb belgilash — atomik (faqat ishlatilmagan bo'lsa). */
    async markAsUsed(codeId: number, userId: number): Promise<boolean> {
        const res = await this.codeRepo
            .createQueryBuilder()
            .update(Code)
            .set({ isUsed: true, usedByUserId: userId, usedAt: () => 'now()' })
            .where('id = :id AND "isUsed" = false', { id: codeId })
            .execute();
        return (res.affected ?? 0) > 0;
    }

    /** Faqat ishlatilmagan kodni o'chirish. */
    async deleteUnused(id: number): Promise<void> {
        const code = await this.codeRepo.findOne({ where: { id } });
        if (!code) throw new NotFoundException('Kod topilmadi');
        if (code.isUsed) throw new BadRequestException("Ishlatilgan kodni o'chirib bo'lmaydi");
        await this.codeRepo.remove(code);
    }

    async stats(productId: number) {
        const [total, used] = await Promise.all([
            this.codeRepo.count({ where: { productId } }),
            this.codeRepo.count({ where: { productId, isUsed: true } }),
        ]);
        return { total, used, unused: total - used };
    }

    findById(id: number) {
        return this.codeRepo.findOne({ where: { id } });
    }
}
