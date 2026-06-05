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
exports.DashboardController = void 0;
const common_1 = require("@nestjs/common");
const users_service_1 = require("../users/users.service");
const products_service_1 = require("../products/products.service");
const gifts_service_1 = require("../gifts/gifts.service");
const confirmations_service_1 = require("../confirmations/confirmations.service");
const auth_guard_1 = require("../common/auth.guard");
let DashboardController = class DashboardController {
    usersService;
    productsService;
    giftsService;
    confirmationsService;
    constructor(usersService, productsService, giftsService, confirmationsService) {
        this.usersService = usersService;
        this.productsService = productsService;
        this.giftsService = giftsService;
        this.confirmationsService = confirmationsService;
    }
    async index(res) {
        const [usersCount, productsCount, giftsCount, confirmCounts, topUsers, topProducts, dailySales, regStats,] = await Promise.all([
            this.usersService.count(),
            this.productsService.count(),
            this.giftsService.count(),
            this.confirmationsService.counts(),
            this.usersService.topBonusUsers(),
            this.productsService.topSoldProducts(),
            this.productsService.dailySalesStats(),
            this.usersService.registrationStats(),
        ]);
        const salesChartData = JSON.stringify({
            labels: dailySales.map(d => d.day.slice(5)),
            sales: dailySales.map(d => d.count),
            bonus: dailySales.map(d => d.bonusTotal),
        });
        const regChartData = JSON.stringify({
            labels: regStats.map(d => d.day.slice(5)),
            counts: regStats.map(d => d.count),
        });
        return res.render('dashboard', {
            title: 'Boshqaruv paneli',
            active: 'dashboard',
            stats: {
                users: usersCount,
                products: productsCount,
                gifts: giftsCount,
                pending: confirmCounts.pending,
                approved: confirmCounts.approved,
            },
            topUsers,
            topProducts,
            salesChartData,
            regChartData,
        });
    }
};
exports.DashboardController = DashboardController;
__decorate([
    (0, common_1.Get)('/'),
    __param(0, (0, common_1.Res)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [Object]),
    __metadata("design:returntype", Promise)
], DashboardController.prototype, "index", null);
exports.DashboardController = DashboardController = __decorate([
    (0, common_1.Controller)(),
    (0, common_1.UseGuards)(auth_guard_1.AdminAuthGuard),
    __metadata("design:paramtypes", [users_service_1.UsersService,
        products_service_1.ProductsService,
        gifts_service_1.GiftsService,
        confirmations_service_1.ConfirmationsService])
], DashboardController);
//# sourceMappingURL=dashboard.controller.js.map