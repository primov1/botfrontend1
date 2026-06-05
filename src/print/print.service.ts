import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { Repository } from 'typeorm';
import { readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import * as QRCode from 'qrcode';
import { Code } from '../common/entities/code.entity';
import { CodesService } from '../codes/codes.service';

@Injectable()
export class PrintService {
    private cachedUsername?: string;
    private cachedLogo?: string | null;

    constructor(
        @InjectRepository(Code) private readonly codeRepo: Repository<Code>,
        @InjectBot() private readonly bot: Telegraf,
        private readonly codesService: CodesService,
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

    /** Berilgan URL uchun QR (base64 data URL). */
    async generateQrCode(url: string): Promise<string> {
        return QRCode.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: 'M' });
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

    /** Stikerlar HTML (string). Har stikerda 1 QR (?start=KOD) + 7 talik ID + admin matn. */
    async generateStickerHtml(codes: Code[]): Promise<string> {
        if (!codes.length) return '<p style="padding:20px">Kod yo\'q</p>';

        const username = await this.getBotUsername();
        const topText = await this.codesService.getStickerText();
        const logo = this.getLogoDataUrl();
        const logoHtml = logo ? `<img class="logo" src="${logo}" alt="logo">` : '';

        const parts: string[] = [];
        for (const c of codes) {
            const qr = await this.generateQrCode(`https://t.me/${username}?start=${c.code}`);
            parts.push(`
        <div class="sticker">
          <div class="s-top">
            ${logoHtml}
            <div class="s-text">${this.esc(topText)}</div>
          </div>
          <div class="qr-center">
            <img class="qr" src="${qr}" alt="QR">
          </div>
          <div class="s-id">ID: <b>${this.esc(c.code)}</b></div>
          <div class="s-exp">${this.fmtExpiry(c.expiresAt)}</div>
        </div>`);
        }
        return parts.join('\n');
    }

    /** To'liq HTML sahifa (chop etishga tayyor). */
    wrapPage(stickersHtml: string, meta: { title: string; info: string }): string {
        return `<!doctype html>
<html lang="uz"><head>
<meta charset="utf-8">
<title>${this.esc(meta.title)}</title>
<style>
  @page { margin: 5mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { margin: 0; font-family: Arial, Helvetica, sans-serif; background: #e9ecef; }
  .bar { padding: 10px 14px; background: #1e293b; color: #fff; display: flex; gap: 14px; align-items: center; position: sticky; top: 0; }
  .bar button { padding: 7px 16px; border: 0; border-radius: 6px; background: #6366f1; color: #fff; font-weight: 600; cursor: pointer; }
  .bar .info { font-size: 13px; opacity: .85; }
  .sheet { display: flex; flex-wrap: wrap; gap: 5mm; padding: 8mm; justify-content: flex-start; }
  .sticker {
    width: 75mm;
    padding: 3mm;
    background: #fff;
    border: 1px dashed #94a3b8;        /* kesish chizig'i */
    text-align: center;
    page-break-inside: avoid; break-inside: avoid;
  }
  .s-top { display: flex; align-items: center; justify-content: center; gap: 6px; margin-bottom: 2mm; }
  .logo { height: 8mm; max-width: 24mm; object-fit: contain; }
  .s-text { font-size: 10pt; font-weight: 700; line-height: 1.15; }
  .qr-center { display: flex; justify-content: center; margin: 2mm 0; }
  .qr { width: 40mm; height: 40mm; }
  .s-id { margin-top: 2.5mm; font-family: 'Courier New', monospace; font-size: 12pt; letter-spacing: 2px; }
  .s-id b { font-weight: 700; }
  .s-exp { font-size: 7.5pt; color: #64748b; margin-top: 0.5mm; }
  @media print {
    body { background: #fff; }
    .bar { display: none; }
    .sheet { padding: 0; gap: 4mm; }
    .sticker { border: 1px dashed #999; }
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
