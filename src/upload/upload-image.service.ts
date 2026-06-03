import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import { randomBytes } from 'node:crypto';
import type { Request } from 'express';

/**
 * Rasmlarni TASHQI xizmatsiz (ImgBB'siz) saqlaydi — bazaning `uploaded_images`
 * jadvalida (bytea). Vercel serverless'da ham ishlaydi (fayl tizimi read-only).
 * Saqlangan rasm public `/i/:id` URL orqali ko'rsatiladi — bot ham yuklab oladi.
 */
@Injectable()
export class UploadImageService implements OnModuleInit {
    private readonly logger = new Logger(UploadImageService.name);

    constructor(private readonly dataSource: DataSource) {}

    async onModuleInit(): Promise<void> {
        try {
            await this.dataSource.query(
                `CREATE TABLE IF NOT EXISTS "uploaded_images" (
                    "id" varchar PRIMARY KEY,
                    "data" bytea NOT NULL,
                    "mime" varchar NOT NULL DEFAULT 'image/jpeg',
                    "createdAt" timestamptz NOT NULL DEFAULT now()
                )`,
            );
        } catch (err) {
            this.logger.warn(`uploaded_images jadvalini yaratib bo'lmadi: ${(err as Error).message}`);
        }
    }

    /** Rasm baytlarini saqlaydi, id qaytaradi. */
    async save(buffer: Buffer, mime = 'image/jpeg'): Promise<string> {
        const id = randomBytes(10).toString('hex');
        await this.dataSource.query(
            `INSERT INTO "uploaded_images" ("id", "data", "mime") VALUES ($1, $2, $3)`,
            [id, buffer, mime],
        );
        return id;
    }

    /** Saqlangan rasmni o'qiydi. */
    async get(id: string): Promise<{ data: Buffer; mime: string } | null> {
        const rows = await this.dataSource.query(
            `SELECT "data", "mime" FROM "uploaded_images" WHERE "id" = $1`,
            [id],
        );
        if (!rows[0]) return null;
        return { data: rows[0].data as Buffer, mime: rows[0].mime as string };
    }

    /** So'rovdan to'liq (absolute) URL quradi — bot ham ishlata olishi uchun. */
    buildUrl(req: Request, id: string): string {
        const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol || 'https';
        const host = req.get('host');
        return `${proto}://${host}/i/${id}`;
    }
}
