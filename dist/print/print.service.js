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
exports.PrintService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const typeorm_2 = require("typeorm");
const node_fs_1 = require("node:fs");
const node_path_1 = require("node:path");
const QRCode = __importStar(require("qrcode"));
const code_entity_1 = require("../common/entities/code.entity");
const codes_service_1 = require("../codes/codes.service");
let PrintService = class PrintService {
    codeRepo;
    bot;
    codesService;
    cachedUsername;
    cachedLogo;
    constructor(codeRepo, bot, codesService) {
        this.codeRepo = codeRepo;
        this.bot = bot;
        this.codesService = codesService;
    }
    async paginateCodes(productId, page = 1, limit = 100) {
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
    async getBotUsername() {
        if (this.cachedUsername)
            return this.cachedUsername;
        const env = process.env.BOT_USERNAME;
        if (env)
            return (this.cachedUsername = env.replace('@', ''));
        try {
            const me = await this.bot.telegram.getMe();
            if (me?.username)
                return (this.cachedUsername = me.username);
        }
        catch { }
        return (this.cachedUsername = 'imkonplusuzum_bot');
    }
    async generateQrCode(url) {
        return QRCode.toDataURL(url, { margin: 1, width: 220, errorCorrectionLevel: 'M' });
    }
    getLogoDataUrl() {
        if (this.cachedLogo !== undefined)
            return this.cachedLogo;
        const candidates = [
            (0, node_path_1.join)(process.cwd(), 'public', 'img', 'logo.png'),
            (0, node_path_1.join)(__dirname, '..', 'assets', 'logo.png'),
            (0, node_path_1.join)(process.cwd(), 'src', 'assets', 'logo.png'),
        ];
        for (const p of candidates) {
            try {
                if ((0, node_fs_1.existsSync)(p)) {
                    return (this.cachedLogo = `data:image/png;base64,${(0, node_fs_1.readFileSync)(p).toString('base64')}`);
                }
            }
            catch { }
        }
        return (this.cachedLogo = null);
    }
    esc(s) {
        return (s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
    }
    fmtExpiry(d) {
        const date = new Date(d);
        const m = String(date.getMonth() + 1).padStart(2, '0');
        return `${m}.${date.getFullYear()}`;
    }
    async generateStickerHtml(codes) {
        if (!codes.length)
            return '<p style="padding:20px">Kod yo\'q</p>';
        const username = await this.getBotUsername();
        const topText = await this.codesService.getStickerText();
        const logo = this.getLogoDataUrl();
        const logoHtml = logo ? `<img class="logo" src="${logo}" alt="logo">` : '';
        const parts = [];
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
    wrapPage(stickersHtml, meta) {
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
};
exports.PrintService = PrintService;
exports.PrintService = PrintService = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(code_entity_1.Code)),
    __param(1, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        telegraf_1.Telegraf,
        codes_service_1.CodesService])
], PrintService);
//# sourceMappingURL=print.service.js.map