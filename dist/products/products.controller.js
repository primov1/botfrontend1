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
exports.ProductsController = void 0;
const common_1 = require("@nestjs/common");
const products_service_1 = require("./products.service");
const auth_guard_1 = require("../common/auth.guard");
let ProductsController = class ProductsController {
    productsService;
    constructor(productsService) {
        this.productsService = productsService;
    }
    async list(q, page, limit, created, updated, deleted, res) {
        const data = await this.productsService.list(q, Number(page) || 1, Number(limit) || 20);
        return res.render('products', {
            title: 'Mahsulotlar', active: 'products', data,
            created: created === '1', updated: updated === '1', deleted: deleted === '1',
        });
    }
    newForm(res) {
        return res.render('product-edit', {
            title: "Mahsulot qo'shish", active: 'products', mode: 'create',
            product: { title: '', image: '', uzum_url: '', bonus: '', telegramChannel: '', instagram: '', requireChannel: false },
        });
    }
    async create(title, image, uzum_url, bonus, telegramChannel, instagram, requireChannel, res) {
        try {
            await this.productsService.create({ title, image, uzum_url, bonus, telegramChannel, instagram, requireChannel });
            return res.redirect('/products?created=1');
        }
        catch (err) {
            return res.render('product-edit', {
                title: "Mahsulot qo'shish", active: 'products', mode: 'create',
                product: { title, image, uzum_url, bonus, telegramChannel, instagram, requireChannel },
                error: err?.message || 'Saqlashda xatolik',
            });
        }
    }
    async edit(id, res) {
        const product = await this.productsService.findById(id);
        return res.render('product-edit', {
            title: 'Mahsulotni tahrirlash', active: 'products', mode: 'edit', product,
        });
    }
    async update(id, title, image, uzum_url, bonus, telegramChannel, instagram, requireChannel, res) {
        try {
            await this.productsService.update(id, { title, image, uzum_url, bonus, telegramChannel, instagram, requireChannel });
            return res.redirect('/products?updated=1');
        }
        catch (err) {
            const product = await this.productsService.findById(id);
            return res.render('product-edit', {
                title: 'Mahsulotni tahrirlash', active: 'products', mode: 'edit',
                product: { ...product, title, image, uzum_url, bonus, telegramChannel, instagram, requireChannel },
                error: err?.message || 'Yangilashda xatolik',
            });
        }
    }
    async remove(id, res) {
        await this.productsService.remove(id);
        return res.redirect('/products?deleted=1');
    }
};
exports.ProductsController = ProductsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('q')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('created')),
    __param(4, (0, common_1.Query)('updated')),
    __param(5, (0, common_1.Query)('deleted')),
    __param(6, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('new'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], ProductsController.prototype, "newForm", null);
__decorate([
    (0, common_1.Post)('new'),
    __param(0, (0, common_1.Body)('title')),
    __param(1, (0, common_1.Body)('image')),
    __param(2, (0, common_1.Body)('uzum_url')),
    __param(3, (0, common_1.Body)('bonus')),
    __param(4, (0, common_1.Body)('telegramChannel')),
    __param(5, (0, common_1.Body)('instagram')),
    __param(6, (0, common_1.Body)('requireChannel')),
    __param(7, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id/edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "edit", null);
__decorate([
    (0, common_1.Post)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.Body)('image')),
    __param(3, (0, common_1.Body)('uzum_url')),
    __param(4, (0, common_1.Body)('bonus')),
    __param(5, (0, common_1.Body)('telegramChannel')),
    __param(6, (0, common_1.Body)('instagram')),
    __param(7, (0, common_1.Body)('requireChannel')),
    __param(8, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], ProductsController.prototype, "remove", null);
exports.ProductsController = ProductsController = __decorate([
    (0, common_1.Controller)('products'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [products_service_1.ProductsService])
], ProductsController);
//# sourceMappingURL=products.controller.js.map