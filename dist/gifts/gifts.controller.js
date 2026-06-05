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
exports.GiftsController = void 0;
const common_1 = require("@nestjs/common");
const gifts_service_1 = require("./gifts.service");
const auth_guard_1 = require("../common/auth.guard");
let GiftsController = class GiftsController {
    giftsService;
    constructor(giftsService) {
        this.giftsService = giftsService;
    }
    async list(q, page, limit, created, updated, deleted, res) {
        const data = await this.giftsService.list(q, Number(page) || 1, Number(limit) || 20);
        return res.render('gifts', {
            title: "Sovg'alar",
            active: 'gifts',
            data,
            created: created === '1',
            updated: updated === '1',
            deleted: deleted === '1',
        });
    }
    newForm(res) {
        return res.render('gift-edit', {
            title: "Sovg'a qo'shish",
            active: 'gifts',
            mode: 'create',
            gift: { title: '', image: '', price: '' },
        });
    }
    async create(title, image, price, res) {
        try {
            await this.giftsService.create({ title, image, price });
            return res.redirect('/gifts?created=1');
        }
        catch (err) {
            return res.render('gift-edit', {
                title: "Sovg'a qo'shish",
                active: 'gifts',
                mode: 'create',
                gift: { title, image, price },
                error: err?.message || 'Saqlashda xatolik',
            });
        }
    }
    async edit(id, res) {
        const gift = await this.giftsService.findById(id);
        return res.render('gift-edit', {
            title: "Sovg'ani tahrirlash",
            active: 'gifts',
            mode: 'edit',
            gift,
        });
    }
    async update(id, title, image, price, res) {
        try {
            await this.giftsService.update(id, { title, image, price });
            return res.redirect('/gifts?updated=1');
        }
        catch (err) {
            const gift = await this.giftsService.findById(id);
            return res.render('gift-edit', {
                title: "Sovg'ani tahrirlash",
                active: 'gifts',
                mode: 'edit',
                gift: { ...gift, title, image, price },
                error: err?.message || 'Yangilashda xatolik',
            });
        }
    }
    async remove(id, res) {
        await this.giftsService.remove(id);
        return res.redirect('/gifts?deleted=1');
    }
    async contactSettingsPage(saved, res) {
        const [phone, telegram] = await Promise.all([
            this.giftsService.getSetting('gift_admin_phone'),
            this.giftsService.getSetting('gift_admin_telegram'),
        ]);
        return res.render('gift-contact-settings', {
            title: "Sovg'a — admin kontakti",
            active: 'gifts',
            phone,
            telegram,
            saved: saved === '1',
        });
    }
    async saveContactSettings(body, res) {
        await Promise.all([
            this.giftsService.setSetting('gift_admin_phone', (body.phone ?? '').trim().slice(0, 30)),
            this.giftsService.setSetting('gift_admin_telegram', (body.telegram ?? '').trim().replace(/^@/, '').slice(0, 64)),
        ]);
        return res.redirect('/gifts/settings/contact?saved=1');
    }
};
exports.GiftsController = GiftsController;
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
], GiftsController.prototype, "list", null);
__decorate([
    (0, common_1.Get)('new'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], GiftsController.prototype, "newForm", null);
__decorate([
    (0, common_1.Post)('new'),
    __param(0, (0, common_1.Body)('title')),
    __param(1, (0, common_1.Body)('image')),
    __param(2, (0, common_1.Body)('price')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], GiftsController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(':id/edit'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GiftsController.prototype, "edit", null);
__decorate([
    (0, common_1.Post)(':id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('title')),
    __param(2, (0, common_1.Body)('image')),
    __param(3, (0, common_1.Body)('price')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], GiftsController.prototype, "update", null);
__decorate([
    (0, common_1.Post)(':id/delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], GiftsController.prototype, "remove", null);
__decorate([
    (0, common_1.Get)('settings/contact'),
    __param(0, (0, common_1.Query)('saved')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], GiftsController.prototype, "contactSettingsPage", null);
__decorate([
    (0, common_1.Post)('settings/contact'),
    __param(0, (0, common_1.Body)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], GiftsController.prototype, "saveContactSettings", null);
exports.GiftsController = GiftsController = __decorate([
    (0, common_1.Controller)('gifts'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [gifts_service_1.GiftsService])
], GiftsController);
//# sourceMappingURL=gifts.controller.js.map