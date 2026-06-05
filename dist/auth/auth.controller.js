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
exports.AuthController = void 0;
const common_1 = require("@nestjs/common");
const auth_service_1 = require("./auth.service");
const admins_service_1 = require("../admins/admins.service");
const auth_guard_1 = require("../common/auth.guard");
const cookie_util_1 = require("../common/cookie.util");
const i18n_1 = require("../common/i18n");
let AuthController = class AuthController {
    authService;
    adminsService;
    constructor(authService, adminsService) {
        this.authService = authService;
        this.adminsService = adminsService;
    }
    async loginPage(req, res) {
        const cookies = (0, cookie_util_1.parseCookies)(req.headers.cookie);
        if (cookies[auth_guard_1.AUTH_COOKIE]) {
            return res.redirect('/');
        }
        return res.render('login', {
            layout: false,
            title: 'Kirish',
            needPhone: await this.adminsService.superAdminLacksPhone(),
        });
    }
    async login(login, password, phone, res) {
        const phoneVal = (phone ?? '').trim();
        let payload;
        try {
            payload = await this.authService.validate((login ?? '').trim(), password ?? '');
        }
        catch {
            return res.status(common_1.HttpStatus.UNAUTHORIZED).render('login', {
                layout: false,
                title: 'Kirish',
                needPhone: await this.adminsService.superAdminLacksPhone(),
                error: 'login_error',
                login,
            });
        }
        const admin = await this.adminsService.findByLogin(payload.sub);
        if (admin && !admin.phone) {
            if (!phoneVal) {
                return res.status(common_1.HttpStatus.BAD_REQUEST).render('login', {
                    layout: false,
                    title: 'Kirish',
                    needPhone: true,
                    error: 'phone_required',
                    login,
                });
            }
            await this.adminsService.setPhone(admin.login, phoneVal);
        }
        const { token, ttl } = this.authService.sign(payload);
        res.cookie(auth_guard_1.AUTH_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ttl * 1000,
            path: '/',
        });
        return res.redirect('/');
    }
    logout(res) {
        res.clearCookie(auth_guard_1.AUTH_COOKIE, { path: '/' });
        return res.redirect('/login');
    }
    setLang(lang, req, res) {
        res.cookie(i18n_1.LANG_COOKIE, (0, i18n_1.normalizeLang)(lang), {
            httpOnly: false,
            sameSite: 'lax',
            maxAge: 365 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        const referer = req.headers.referer || '';
        let back = '/';
        try {
            const url = new URL(referer);
            if (url.origin === `${req.protocol}://${req.headers.host}`) {
                back = url.pathname + url.search;
            }
        }
        catch { }
        return res.redirect(back);
    }
};
exports.AuthController = AuthController;
__decorate([
    (0, common_1.Get)('login'),
    __param(0, (0, common_1.Req)()),
    __param(1, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "loginPage", null);
__decorate([
    (0, common_1.Post)('login'),
    __param(0, (0, common_1.Body)('login')),
    __param(1, (0, common_1.Body)('password')),
    __param(2, (0, common_1.Body)('phone')),
    __param(3, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, String, Object]),
    __metadata("design:returntype", Promise)
], AuthController.prototype, "login", null);
__decorate([
    (0, common_1.Get)('logout'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "logout", null);
__decorate([
    (0, common_1.Get)('lang/:lang'),
    __param(0, (0, common_1.Param)('lang')),
    __param(1, (0, common_1.Req)()),
    __param(2, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, Object, Object]),
    __metadata("design:returntype", void 0)
], AuthController.prototype, "setLang", null);
exports.AuthController = AuthController = __decorate([
    (0, common_1.Controller)(),
    __metadata("design:paramtypes", [auth_service_1.AuthService,
        admins_service_1.AdminsService])
], AuthController);
//# sourceMappingURL=auth.controller.js.map