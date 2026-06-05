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
exports.PendingCountInterceptor = void 0;
const common_1 = require("@nestjs/common");
const confirmations_service_1 = require("./confirmations.service");
const admins_service_1 = require("../admins/admins.service");
const gift_orders_service_1 = require("../gift-orders/gift-orders.service");
const cookie_util_1 = require("../common/cookie.util");
const i18n_1 = require("../common/i18n");
let PendingCountInterceptor = class PendingCountInterceptor {
    confirmationsService;
    adminsService;
    giftOrdersService;
    constructor(confirmationsService, adminsService, giftOrdersService) {
        this.confirmationsService = confirmationsService;
        this.adminsService = adminsService;
        this.giftOrdersService = giftOrdersService;
    }
    async intercept(context, next) {
        if (context.getType() === 'http') {
            const req = context.switchToHttp().getRequest();
            const res = context.switchToHttp().getResponse();
            if (res?.locals) {
                const cookies = (0, cookie_util_1.parseCookies)(req.headers?.cookie);
                res.locals.lang = (0, i18n_1.normalizeLang)(cookies[i18n_1.LANG_COOKIE]);
                try {
                    res.locals.pendingConfirmations = await this.confirmationsService.pendingCount();
                }
                catch {
                    res.locals.pendingConfirmations = 0;
                }
                try {
                    res.locals.pendingGifts = await this.giftOrdersService.pendingCount();
                }
                catch {
                    res.locals.pendingGifts = 0;
                }
                const login = req.admin?.sub;
                if (login) {
                    const admin = await this.adminsService.findByLogin(login);
                    res.locals.adminProfile = admin ? admins_service_1.AdminsService.toPublic(admin) : null;
                }
            }
        }
        return next.handle();
    }
};
exports.PendingCountInterceptor = PendingCountInterceptor;
exports.PendingCountInterceptor = PendingCountInterceptor = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [confirmations_service_1.ConfirmationsService,
        admins_service_1.AdminsService,
        gift_orders_service_1.GiftOrdersService])
], PendingCountInterceptor);
//# sourceMappingURL=pending-count.interceptor.js.map