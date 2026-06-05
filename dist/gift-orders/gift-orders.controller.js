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
exports.GiftOrdersController = void 0;
const common_1 = require("@nestjs/common");
const gift_orders_service_1 = require("./gift-orders.service");
const auth_guard_1 = require("../common/auth.guard");
let GiftOrdersController = class GiftOrdersController {
    giftOrders;
    constructor(giftOrders) {
        this.giftOrders = giftOrders;
    }
    async count() {
        return { pending: await this.giftOrders.pendingCount() };
    }
    async list(filter, page, ok, res) {
        const f = (['pending', 'approved', 'rejected', 'all'].includes(filter) ? filter : 'pending');
        const data = await this.giftOrders.list(Number(page) || 1, 20, f);
        return res.render('gift-orders', {
            title: "Sovg'a buyurtmalari",
            active: 'gift-orders',
            data,
            ok,
        });
    }
    async approve(id, filter, res) {
        await this.giftOrders.approve(id);
        return res.redirect(`/gift-orders?filter=${filter || 'pending'}&ok=approved`);
    }
    async reject(id, filter, res) {
        await this.giftOrders.reject(id);
        return res.redirect(`/gift-orders?filter=${filter || 'pending'}&ok=rejected`);
    }
    async deliver(id, filter, res) {
        await this.giftOrders.setDelivered(id, true);
        return res.redirect(`/gift-orders?filter=${filter || 'approved'}&ok=delivered`);
    }
    async remove(id, filter, res) {
        await this.giftOrders.delete(id);
        return res.redirect(`/gift-orders?filter=${filter || 'all'}&ok=deleted`);
    }
};
exports.GiftOrdersController = GiftOrdersController;
__decorate([
    (0, common_1.Get)('count'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], GiftOrdersController.prototype, "count", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('filter')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('ok')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], GiftOrdersController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('filter')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], GiftOrdersController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('filter')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], GiftOrdersController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/deliver'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('filter')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], GiftOrdersController.prototype, "deliver", null);
__decorate([
    (0, common_1.Post)(':id/delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('filter')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], GiftOrdersController.prototype, "remove", null);
exports.GiftOrdersController = GiftOrdersController = __decorate([
    (0, common_1.Controller)('gift-orders'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [gift_orders_service_1.GiftOrdersService])
], GiftOrdersController);
//# sourceMappingURL=gift-orders.controller.js.map