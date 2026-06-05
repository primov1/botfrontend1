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
exports.AdminsController = void 0;
const common_1 = require("@nestjs/common");
const admins_service_1 = require("./admins.service");
const auth_guard_1 = require("../common/auth.guard");
const super_admin_guard_1 = require("../common/super-admin.guard");
let AdminsController = class AdminsController {
    adminsService;
    constructor(adminsService) {
        this.adminsService = adminsService;
    }
    async list(query, res) {
        const [admins, max] = await Promise.all([
            this.adminsService.list(),
            this.adminsService.getMaxAdmins(),
        ]);
        return res.render('admins', {
            title: 'Adminlar',
            active: 'admins',
            admins: admins.map(admins_service_1.AdminsService.toPublic),
            count: admins.length,
            max,
            limitReached: admins.length >= max,
            query,
        });
    }
    async setLimit(max, res) {
        try {
            await this.adminsService.setMaxAdmins(Number(max));
            return res.redirect('/admins?limit_ok=1');
        }
        catch (err) {
            return res.redirect('/admins?error=' + encodeURIComponent((err?.message || 'Xatolik').substring(0, 120)));
        }
    }
    async create(login, password, name, phone, res) {
        try {
            await this.adminsService.createAdmin({ login, password, name, phone });
            return res.redirect('/admins?created=1');
        }
        catch (err) {
            return res.redirect('/admins?error=' + encodeURIComponent((err?.message || 'Xatolik').substring(0, 120)));
        }
    }
    async remove(id, res) {
        try {
            await this.adminsService.deleteAdmin(id);
            return res.redirect('/admins?deleted=1');
        }
        catch (err) {
            return res.redirect('/admins?error=' + encodeURIComponent((err?.message || 'Xatolik').substring(0, 120)));
        }
    }
};
exports.AdminsController = AdminsController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Query)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminsController.prototype, "list", null);
__decorate([
    (0, common_1.Post)('limit'),
    __param(0, (0, common_1.Body)('max')),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object]),
    __metadata("design:returntype", Promise)
], AdminsController.prototype, "setLimit", null);
__decorate([
    (0, common_1.Post)('new'),
    __param(0, (0, common_1.Body)('login')),
    __param(1, (0, common_1.Body)('password')),
    __param(2, (0, common_1.Body)('name')),
    __param(3, (0, common_1.Body)('phone')),
    __param(4, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminsController.prototype, "create", null);
__decorate([
    (0, common_1.Post)(':id/delete'),
    __param(0, (0, common_1.Param)('id', common_1.ParseIntPipe)),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Number, Object]),
    __metadata("design:returntype", Promise)
], AdminsController.prototype, "remove", null);
exports.AdminsController = AdminsController = __decorate([
    (0, common_1.Controller)('admins'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard, super_admin_guard_1.SuperAdminGuard),
    __metadata("design:paramtypes", [admins_service_1.AdminsService])
], AdminsController);
//# sourceMappingURL=admins.controller.js.map