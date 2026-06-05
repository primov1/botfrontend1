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
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const jwt_1 = require("@nestjs/jwt");
const admins_service_1 = require("../admins/admins.service");
let AuthService = class AuthService {
    config;
    jwt;
    adminsService;
    constructor(config, jwt, adminsService) {
        this.config = config;
        this.jwt = jwt;
        this.adminsService = adminsService;
    }
    async validate(login, password) {
        const admin = await this.adminsService.validateCredentials(login, password);
        if (!admin)
            throw new common_1.UnauthorizedException("Login yoki parol noto'g'ri");
        return { sub: admin.login, role: 'admin', isSuper: admin.isSuper };
    }
    sign(payload) {
        const ttl = Number(this.config.get('JWT_TTL', '86400'));
        const token = this.jwt.sign(payload, { expiresIn: ttl });
        return { token, ttl };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [config_1.ConfigService,
        jwt_1.JwtService,
        admins_service_1.AdminsService])
], AuthService);
//# sourceMappingURL=auth.service.js.map