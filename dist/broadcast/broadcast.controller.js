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
exports.BroadcastController = void 0;
const common_1 = require("@nestjs/common");
const broadcast_service_1 = require("./broadcast.service");
const auth_guard_1 = require("../common/auth.guard");
const users_service_1 = require("../users/users.service");
let BroadcastController = class BroadcastController {
    broadcastService;
    usersService;
    constructor(broadcastService, usersService) {
        this.broadcastService = broadcastService;
        this.usersService = usersService;
    }
    showForm(res) {
        return res.render('broadcast', {
            title: 'Xabar yuborish', active: 'broadcast',
        });
    }
    async sendToAll(message, res) {
        const trimmed = (message ?? '').trim();
        if (!trimmed) {
            return res.render('broadcast', {
                title: 'Xabar yuborish', active: 'broadcast',
                error: "Xabar bo'sh bo'lishi mumkin emas.",
            });
        }
        const result = await this.broadcastService.sendToAll(trimmed);
        return res.render('broadcast', {
            title: 'Xabar yuborish', active: 'broadcast', result,
        });
    }
    async sendToOne(id, message, res) {
        const trimmed = (message ?? '').trim();
        if (!trimmed)
            return res.redirect(`/users/${id}?msg_error=1`);
        const user = await this.usersService.findById(id);
        const ok = await this.broadcastService.sendToOne(user.telegramId, trimmed);
        return res.redirect(`/users/${id}?msg_sent=${ok ? '1' : '0'}`);
    }
};
exports.BroadcastController = BroadcastController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], BroadcastController.prototype, "showForm", null);
__decorate([
    (0, common_1.Post)('all'),
    __param(0, (0, common_1.Body)('message')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], BroadcastController.prototype, "sendToAll", null);
__decorate([
    (0, common_1.Post)('user/:id'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Body)('message')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, String, Object]),
    __metadata("design:returntype", Promise)
], BroadcastController.prototype, "sendToOne", null);
exports.BroadcastController = BroadcastController = __decorate([
    (0, common_1.Controller)('broadcast'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [broadcast_service_1.BroadcastService,
        users_service_1.UsersService])
], BroadcastController);
//# sourceMappingURL=broadcast.controller.js.map