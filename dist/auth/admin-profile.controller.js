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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminProfileController = void 0;
const common_1 = require("@nestjs/common");
const platform_express_1 = require("@nestjs/platform-express");
const multer_1 = require("multer");
const auth_guard_1 = require("../common/auth.guard");
const admins_service_1 = require("../admins/admins.service");
const auth_service_1 = require("./auth.service");
const auth_guard_2 = require("../common/auth.guard");
const upload_image_service_1 = require("../upload/upload-image.service");
const sharp_1 = __importDefault(require("sharp"));
let AdminProfileController = class AdminProfileController {
    adminsService;
    authService;
    uploadImage;
    constructor(adminsService, authService, uploadImage) {
        this.adminsService = adminsService;
        this.authService = authService;
        this.uploadImage = uploadImage;
    }
    currentLogin(req) {
        return req.admin?.sub ?? '';
    }
    async show(req, query, res) {
        const admin = await this.adminsService.findByLogin(this.currentLogin(req));
        return res.render('admin-profile', {
            title: 'Admin profil', active: 'admin-profile',
            profile: admin ? admins_service_1.AdminsService.toPublic(admin) : null, query,
        });
    }
    async updateName(req, name, res) {
        const t = (name ?? '').trim();
        if (!t)
            return res.redirect('/admin/profile?name_error=1');
        await this.adminsService.updateName(this.currentLogin(req), t);
        return res.redirect('/admin/profile?name_ok=1');
    }
    async updateCredentials(req, currentPassword, newLogin, newPassword, confirmPassword, phone, res) {
        const login = this.currentLogin(req);
        const admin = await this.adminsService.validateCredentials(login, currentPassword ?? '');
        if (!admin)
            return res.redirect('/admin/profile?cred_error=wrong_current');
        const loginVal = (newLogin ?? '').trim();
        const passVal = (newPassword ?? '').trim();
        const phoneVal = (phone ?? '').trim();
        if (!loginVal || loginVal.length < 3)
            return res.redirect('/admin/profile?cred_error=login_short');
        if (!phoneVal)
            return res.redirect('/admin/profile?cred_error=phone_required');
        if (passVal) {
            if (passVal.length < 6)
                return res.redirect('/admin/profile?cred_error=pass_short');
            if (passVal !== (confirmPassword ?? '').trim())
                return res.redirect('/admin/profile?cred_error=pass_mismatch');
        }
        let updatedLogin;
        try {
            updatedLogin = await this.adminsService.applyProfileUpdate(login, {
                newLogin: loginVal,
                phone: phoneVal,
                newPassword: passVal || undefined,
            });
        }
        catch (err) {
            if (err?.message === 'login_taken')
                return res.redirect('/admin/profile?cred_error=login_taken');
            return res.redirect('/admin/profile?cred_error=unknown');
        }
        const { token, ttl } = this.authService.sign({
            sub: updatedLogin, role: 'admin', isSuper: admin.isSuper,
        });
        res.cookie(auth_guard_2.AUTH_COOKIE, token, {
            httpOnly: true, sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ttl * 1000, path: '/',
        });
        return res.redirect('/admin/profile?cred_ok=1');
    }
    async uploadAvatar(_req, file, res) {
        if (!file)
            return res.redirect('/admin/profile?avatar_error=invalid_file');
        try {
            const resized = await (0, sharp_1.default)(file.buffer)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 85 })
                .toBuffer();
            const url = await this.uploadImage.upload(resized);
            if (!url)
                return res.redirect('/admin/profile?avatar_error=imgbb_key_missing');
            await this.adminsService.setAvatar(this.currentLogin(_req), url);
            return res.redirect('/admin/profile?avatar_ok=1');
        }
        catch {
            return res.redirect('/admin/profile?avatar_error=processing');
        }
    }
    async removeAvatar(req, res) {
        await this.adminsService.removeAvatar(this.currentLogin(req));
        return res.redirect('/admin/profile?avatar_removed=1');
    }
};
exports.AdminProfileController = AdminProfileController;
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Query)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminProfileController.prototype, "show", null);
__decorate([
    (0, common_1.Post)('name'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('name')),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, Object]),
    __metadata("design:returntype", Promise)
], AdminProfileController.prototype, "updateName", null);
__decorate([
    (0, common_1.Post)('credentials'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Body)('currentPassword')),
    __param(2, (0, common_1.Body)('newLogin')),
    __param(3, (0, common_1.Body)('newPassword')),
    __param(4, (0, common_1.Body)('confirmPassword')),
    __param(5, (0, common_1.Body)('phone')),
    __param(6, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, String, String, String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AdminProfileController.prototype, "updateCredentials", null);
__decorate([
    (0, common_1.Post)('avatar'),
    (0, common_1.UseInterceptors)((0, platform_express_1.FileInterceptor)('avatar', {
        storage: (0, multer_1.memoryStorage)(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
        },
    })),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.UploadedFile)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object, Object]),
    __metadata("design:returntype", Promise)
], AdminProfileController.prototype, "uploadAvatar", null);
__decorate([
    (0, common_1.Post)('avatar/remove'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AdminProfileController.prototype, "removeAvatar", null);
exports.AdminProfileController = AdminProfileController = __decorate([
    (0, common_1.Controller)('admin/profile'),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [admins_service_1.AdminsService,
        auth_service_1.AuthService,
        upload_image_service_1.UploadImageService])
], AdminProfileController);
//# sourceMappingURL=admin-profile.controller.js.map