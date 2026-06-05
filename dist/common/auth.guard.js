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
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminAuthGuard = exports.AUTH_COOKIE = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const cookie_util_1 = require("./cookie.util");
exports.AUTH_COOKIE = 'admin_token';
let AdminAuthGuard = class AdminAuthGuard {
    jwt;
    constructor(jwt) {
        this.jwt = jwt;
    }
    canActivate(context) {
        const req = context.switchToHttp().getRequest();
        const res = context.switchToHttp().getResponse();
        const cookies = (0, cookie_util_1.parseCookies)(req.headers?.cookie);
        const token = cookies[exports.AUTH_COOKIE];
        if (!token) {
            res.redirect('/login');
            return false;
        }
        try {
            const payload = this.jwt.verify(token);
            req.admin = payload;
            return true;
        }
        catch {
            res.clearCookie(exports.AUTH_COOKIE);
            res.redirect('/login');
            return false;
        }
    }
};
exports.AdminAuthGuard = AdminAuthGuard;
exports.AdminAuthGuard = AdminAuthGuard = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [jwt_1.JwtService])
], AdminAuthGuard);
//# sourceMappingURL=auth.guard.js.map