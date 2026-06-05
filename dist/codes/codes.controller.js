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
exports.CodesController = void 0;
const common_1 = require("@nestjs/common");
const codes_service_1 = require("./codes.service");
const products_service_1 = require("../products/products.service");
const auth_guard_1 = require("../common/auth.guard");
let CodesController = class CodesController {
    codesService;
    productsService;
    constructor(codesService, productsService) {
        this.codesService = codesService;
        this.productsService = productsService;
    }
    async page(generated, error, res) {
        const [products, stickerText, botUsername] = await Promise.all([
            this.productsService.list(undefined, 1, 1000),
            this.codesService.getStickerText(),
            this.codesService.getBotUsername(),
        ]);
        return res.render('codes', {
            title: 'Kodlar', active: 'codes',
            products: products.items, stickerText, botUsername,
            generated: generated ? Number(generated) : 0,
            error,
        });
    }
    async saveStickerText(text, res) {
        await this.codesService.setStickerText(text ?? '');
        return res.redirect('/admin/codes');
    }
    async generate(productId, count, res) {
        try {
            const { count: n } = await this.codesService.generateCodes(Number(productId), Number(count));
            return res.redirect(`/admin/codes?product_id=${productId}&generated=${n}`);
        }
        catch (err) {
            return res.redirect('/admin/codes?error=' + encodeURIComponent((err?.message || 'Xatolik').slice(0, 120)));
        }
    }
    async export(productId, res) {
        const { filename, content } = await this.codesService.exportToCsv(productId);
        res.setHeader('Content-Type', 'text/csv; charset=utf-8');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(content);
    }
    async removeForm(id, back, res) {
        try {
            await this.codesService.deleteUnused(id);
        }
        catch { }
        return res.redirect(back && back.startsWith('/admin/codes') ? back : '/admin/codes');
    }
    async remove(id) {
        await this.codesService.deleteUnused(id);
        return { success: true };
    }
};
exports.CodesController = CodesController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('generated')),
    __param(1, (0, common_1.Query)('error')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CodesController.prototype, "page", null);
__decorate([
    (0, common_1.Post)('sticker-text'),
    __param(0, (0, common_1.Body)('text')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], CodesController.prototype, "saveStickerText", null);
__decorate([
    (0, common_1.Post)('generate'),
    __param(0, (0, common_1.Body)('product_id')),
    __param(1, (0, common_1.Body)('count')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, Object]),
    __metadata("design:returntype", Promise)
], CodesController.prototype, "generate", null);
__decorate([
    (0, common_1.Get)('export/:productId'),
    __param(0, (0, common_1.Param)('productId', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], CodesController.prototype, "export", null);
__decorate([
    (0, common_1.Post)(':id/delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('back')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], CodesController.prototype, "removeForm", null);
__decorate([
    (0, common_1.Delete)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number]),
    __metadata("design:returntype", Promise)
], CodesController.prototype, "remove", null);
exports.CodesController = CodesController = __decorate([
    (0, common_1.Controller)('admin/codes'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [codes_service_1.CodesService,
        products_service_1.ProductsService])
], CodesController);
//# sourceMappingURL=codes.controller.js.map