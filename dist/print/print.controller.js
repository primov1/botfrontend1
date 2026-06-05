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
exports.PrintController = void 0;
const common_1 = require("@nestjs/common");
const print_service_1 = require("./print.service");
const pdf_service_1 = require("./pdf.service");
const codes_service_1 = require("../codes/codes.service");
const auth_guard_1 = require("../common/auth.guard");
let PrintController = class PrintController {
    printService;
    pdfService;
    codesService;
    constructor(printService, pdfService, codesService) {
        this.printService = printService;
        this.pdfService = pdfService;
        this.codesService = codesService;
    }
    async generatePdf(text, count, productId, res) {
        const n = Math.floor(Number(count) || 0);
        const pid = Number(productId) || 0;
        if (n < 1) {
            return res.redirect('/admin/codes?error=' + encodeURIComponent('Nechta ekanligi kiriting'));
        }
        try {
            const nick = await this.printService.getBotUsername();
            await this.codesService.setStickerText(text ?? '');
            const { codes } = await this.codesService.generateCodes(pid, n);
            const pdf = await this.pdfService.generate(codes, {
                botUsername: nick, text: text ?? '', productId: pid,
            });
            res.setHeader('Content-Type', 'application/pdf');
            res.setHeader('Content-Disposition', `attachment; filename="stikerlar_${n}_${Date.now()}.pdf"`);
            res.send(pdf);
        }
        catch (err) {
            return res.redirect('/admin/codes?error=' + encodeURIComponent((err?.message || 'Xatolik').slice(0, 120)));
        }
    }
    async single(codeId, res) {
        const code = await this.codesService.findById(codeId);
        if (!code) {
            res.status(404).send('Kod topilmadi');
            return;
        }
        const stickers = await this.printService.generateStickerHtml([code]);
        const html = this.printService.wrapPage(stickers, { title: `Stiker — ${code.code}`, info: '1 ta stiker' });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }
    async print(productId, page, limit, res) {
        const data = await this.printService.paginateCodes(productId, Number(page) || 1, Number(limit) || 100);
        const stickers = await this.printService.generateStickerHtml(data.items);
        const html = this.printService.wrapPage(stickers, {
            title: `Stikerlar — P${productId}`,
            info: `Sahifa ${data.page}/${data.totalPages} • ${data.items.length} ta stiker • Jami: ${data.total}`,
        });
        res.setHeader('Content-Type', 'text/html; charset=utf-8');
        res.send(html);
    }
};
exports.PrintController = PrintController;
__decorate([
    (0, common_1.Post)('generate-pdf'),
    __param(0, (0, common_1.Body)('text')),
    __param(1, (0, common_1.Body)('count')),
    __param(2, (0, common_1.Body)('product_id')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], PrintController.prototype, "generatePdf", null);
__decorate([
    (0, common_1.Get)('single/:codeId'),
    __param(0, (0, common_1.Param)('codeId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], PrintController.prototype, "single", null);
__decorate([
    (0, common_1.Get)(':productId'),
    __param(0, (0, common_1.Param)('productId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], PrintController.prototype, "print", null);
exports.PrintController = PrintController = __decorate([
    (0, common_1.Controller)('admin/print'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [print_service_1.PrintService,
        pdf_service_1.PdfService,
        codes_service_1.CodesService])
], PrintController);
//# sourceMappingURL=print.controller.js.map