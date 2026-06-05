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
exports.ConfirmationsController = void 0;
const common_1 = require("@nestjs/common");
const confirmations_service_1 = require("./confirmations.service");
const auth_guard_1 = require("../common/auth.guard");
let ConfirmationsController = class ConfirmationsController {
    confirmationsService;
    constructor(confirmationsService) {
        this.confirmationsService = confirmationsService;
    }
    async count() {
        return { pending: await this.confirmationsService.pendingCount() };
    }
    async list(status, page, limit, approved, rejected, res) {
        const data = await this.confirmationsService.list(status, Number(page) || 1, Number(limit) || 20);
        return res.render('confirmations', {
            title: 'Bonus tasdiqlash',
            active: 'confirmations',
            data,
            approved: approved === '1',
            rejected: rejected === '1',
        });
    }
    async approve(id, status, res) {
        await this.confirmationsService.approve(id);
        return res.redirect(this.backUrl(status, 'approved'));
    }
    async reject(id, note, status, res) {
        await this.confirmationsService.reject(id, (note ?? '').trim());
        return res.redirect(this.backUrl(status, 'rejected'));
    }
    async remove(id, status, res) {
        await this.confirmationsService.delete(id);
        return res.redirect(this.backUrl(status, 'deleted'));
    }
    backUrl(status, flag) {
        const valid = ['pending', 'approved', 'rejected', 'all'];
        const st = valid.includes(status) ? status : 'pending';
        return `/confirmations?status=${st}&${flag}=1`;
    }
};
exports.ConfirmationsController = ConfirmationsController;
__decorate([
    (0, common_1.Get)('count'),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", []),
    __metadata("design:returntype", Promise)
], ConfirmationsController.prototype, "count", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)('status')),
    __param(1, (0, common_1.Query)('page')),
    __param(2, (0, common_1.Query)('limit')),
    __param(3, (0, common_1.Query)('approved')),
    __param(4, (0, common_1.Query)('rejected')),
    __param(5, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], ConfirmationsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)(':id/approve'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], ConfirmationsController.prototype, "approve", null);
__decorate([
    (0, common_1.Post)(':id/reject'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('note')),
    __param(2, (0, common_1.Query)('status')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, String, Object]),
    __metadata("design:returntype", Promise)
], ConfirmationsController.prototype, "reject", null);
__decorate([
    (0, common_1.Post)(':id/delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Query)('status')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], ConfirmationsController.prototype, "remove", null);
exports.ConfirmationsController = ConfirmationsController = __decorate([
    (0, common_1.Controller)('confirmations'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [confirmations_service_1.ConfirmationsService])
], ConfirmationsController);
//# sourceMappingURL=confirmations.controller.js.map