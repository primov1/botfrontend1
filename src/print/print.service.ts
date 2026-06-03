import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { In, Repository } from 'typeorm';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as QRCode from 'qrcode';
import { Code } from '../common/entities/code.entity';
import { Product } from '../common/entities/product.entity';

@Injectable()
export class PrintService {
    private cachedUsername?: string;
    private cachedLogo?: string | null;

    constructor(
        @InjectRepository(Code) private readonly codeRepo: Repository<Code>,
        @InjectRepository(Product) private readonly productRepo: Repository<Product>,
        @InjectBot() private readonly bot: Telegraf,
    ) {}

    /** Sahifalab kodlarni qaytaradi. */
    async paginateCodes(productId: number, page = 1, limit = 100) {
        page = Math.max(1, Math.floor(page) || 1);
        limit = Math.min(500, Math.max(1, Math.floor(limit) || 100));
        const [items, total] = await this.codeRepo.findAndCount({
            where: { productId },
            order: { createdAt: 'ASC' },
            skip: (page - 1) * limit,
            take: limit,
        });
        return { items, total, page, limit, totalPages: Math.max(1, Math.ceil(total / limit)) };
    }

    /** Bot username (QR uchun) — env, keyin getMe, keyin default. */
    async getBotUsername(): Promise<string> {
        if (this.cachedUsername) return this.cachedUsername;
        const env = process.env.BOT_USERNAME;
        if (env) return (this.cachedUsername = env.replace('@', ''));
        try {
            const me = await this.bot.telegram.getMe();
            if (me?.username) return (this.cachedUsername = me.username);
        } catch { /* jim */ }
        return (this.cachedUsername = 'imkonplusuzum_bot');
    }

    /** t.me/botusername uchun QR (base64 data URL). Kod URL'da YO'Q. */
    async generateQrCode(botUsername: string): Promise<string> {
        return QRCode.toDataURL(`https://t.me/${botUsername}`, { margin: 1, width: 220 });
    }

    /** Logo (base64) — public/img/logo.png yoki src/assets/logo.png dan. */
    private getLogoDataUrl(): string | null {
        if (this.cachedLogo !== undefined) return this.cachedLogo;
        const candidates = [
            join(process.cwd(), 'public', 'img', 'logo.png'),
            join(__dirname, '..', 'assets', 'logo.png'),
            join(process.cwd(), 'src', 'assets', 'logo.png'),
        ];
        for (const p of candidates) {
            try {
                if (existsSync(p)) {
                    return (this.cachedLogo = `data:image/png;base64,${readFileSync(p).toString('base64')}`);
                }
            } catch { /* keyingisi */ }
        }
        return (this.cachedLogo = null);
    }

    private esc(s: string): string {
        return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }

    /** Muddat: "12.2026" (oy.yil) */
    private fmtExpiry(d: Date): string {
        const date = new Date(d);
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${m}.${date.getFullYear()}`;
    }

    /** Stikerlar HTML (string). */
    async generateStickerHtml(codes: Code[]): Promise<string> {
        if (!codes.length) return '<p style="padding:20px">Kod yo\'q</p>';

        const productIds = [...new Set(codes.map((c) => c.productId))];
        const products = await this.productRepo.find({ where: { id: In(productIds) } });
        const nameMap: Record<number, string> = {};
        for (const p of products) nameMap[p.id] = p.title;

        const username = await this.getBotUsername();
        const qr = await this.generateQrCode(username);
        const logo = this.getLogoDataUrl();
        const logoHtml = logo
            ? `<img class="logo" src="${logo}" alt="logo">`
            : `<div class="logo-ph">LOGO</div>`;

        return codes.map((c) => `
        <div class="sticker">
          ${logoHtml}
          <div class="pname">${this.esc(nameMap[c.productId] ?? '')}</div>
          <img class="qr" src="${qr}" alt="QR">
          <div class="code">${this.esc(c.code)}</div>
          <div class="expiry">${this.fmtExpiry(c.expiresAt)}</div>
        </div>`).join('\n');
    }

    /** To'liq HTML sahifa (chop etishga tayyor). */
    wrapPage(stickersHtml: string, meta: { title: string; info: string }): string {
        return `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8">
<title>${this.esc(meta.title)}</title>
<style>
  @page { size: 40mm 60mm; margin: 0; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #e9ecef; }
  .bar { padding: 10px 14px; background: #1e293b; color: #fff; display: flex; gap: 14px; align-items: center; position: sticky; top: 0; }
  .bar button { padding: 7px 16px; border: 0; border-radius: 6px; background: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .bar .info { font-size: 13px; opacity: .85; }
  .sheet { display: flex; flex-wrap: wrap; gap: 4mm; padding: 10mm; justify-content: center; }
  .sticker {
    width: 40mm; height: 60mm;
    padding: 2.5mm 2mm;
    background: #fff;
    border: 1px solid #94a3b8;        /* kesish chizig'i */
    display: flex; flex-direction: column;
    align-items: center; justify-content: space-between;
    text-align: center; overflow: hidden;
    page-break-after: always; break-after: page;
  }
  .sticker:last-child { page-break-after: auto; break-after: auto; }
  .logo { height: 7mm; max-width: 30mm; object-fit: contain; }
  .logo-ph { height: 7mm; min-width: 18mm; display: flex; align-items: center; justify-content: center;
             font-size: 6pt; color: #94a3b8; border: 1px dashed #cbd5e1; border-radius: 2px; }
  .pname { font-size: 8pt; font-weight: 700; line-height: 1.1; max-height: 10mm; overflow: hidden; }
  .qr { width: 23mm; height: 23mm; }
  .code { font-family: 'Courier New', monospace; font-size: 11pt; font-weight: 700; letter-spacing: 1.5px; }
  .expiry { font-size: 7.5pt; color: #334155; font-weight: 600; }
  @media print {
    body { background: #fff; }
    .bar { display: none; }
    .sheet { padding: 0; gap: 0; }
    .sticker { border: 1px solid #000; }
  }
</style></head>
<body>
  <div class="bar">
    <button onclick="window.print()">🖨 Chop etish (Ctrl+P)</button>
    <span class="info">${this.esc(meta.info)}</span>
  </div>
  <div class="sheet">
    ${stickersHtml}
  </div>
</body></html>`;
    }
}
