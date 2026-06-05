"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AppModule = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const auth_module_1 = require("./auth/auth.module");
const users_module_1 = require("./users/users.module");
const products_module_1 = require("./products/products.module");
const gifts_module_1 = require("./gifts/gifts.module");
const confirmations_module_1 = require("./confirmations/confirmations.module");
const dashboard_module_1 = require("./dashboard/dashboard.module");
const broadcast_module_1 = require("./broadcast/broadcast.module");
const upload_module_1 = require("./upload/upload.module");
const gift_orders_module_1 = require("./gift-orders/gift-orders.module");
const codes_module_1 = require("./codes/codes.module");
const print_module_1 = require("./print/print.module");
const code_entity_1 = require("./common/entities/code.entity");
const user_entity_1 = require("./common/entities/user.entity");
const product_entity_1 = require("./common/entities/product.entity");
const gift_entity_1 = require("./common/entities/gift.entity");
const purchase_entity_1 = require("./common/entities/purchase.entity");
const gift_purchase_entity_1 = require("./common/entities/gift-purchase.entity");
const app_setting_entity_1 = require("./common/entities/app-setting.entity");
const admin_entity_1 = require("./common/entities/admin.entity");
const admins_module_1 = require("./admins/admins.module");
let AppModule = class AppModule {
};
exports.AppModule = AppModule;
exports.AppModule = AppModule = __decorate([
    (0, common_1.Module)({
        imports: [
            config_1.ConfigModule.forRoot({ isGlobal: true }),
            typeorm_1.TypeOrmModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => {
                    const url = config.get('DATABASE_URL');
                    const ssl = config.get('DB_SSL') !== 'false' &&
                        (config.get('NODE_ENV') === 'production' ||
                            config.get('DB_SSL') === 'true')
                        ? { rejectUnauthorized: false }
                        : false;
                    const base = {
                        type: 'postgres',
                        entities: [user_entity_1.User, product_entity_1.Product, gift_entity_1.Gift, purchase_entity_1.Purchase, gift_purchase_entity_1.GiftPurchase, app_setting_entity_1.AppSetting, admin_entity_1.Admin, code_entity_1.Code],
                        synchronize: config.get('NODE_ENV') !== 'production',
                        logging: config.get('NODE_ENV') === 'development',
                        ssl,
                    };
                    return url
                        ? { ...base, url }
                        : {
                            ...base,
                            host: config.get('DB_HOST', 'localhost'),
                            port: config.get('DB_PORT', 5432),
                            username: config.get('DB_USERNAME', 'postgres'),
                            password: config.get('DB_PASSWORD', ''),
                            database: config.get('DB_NAME', 'bot_loyiha'),
                        };
                },
            }),
            nestjs_telegraf_1.TelegrafModule.forRootAsync({
                inject: [config_1.ConfigService],
                useFactory: (config) => ({
                    token: config.get('BOT_TOKEN') ?? '',
                    launchOptions: false,
                }),
            }),
            admins_module_1.AdminsModule,
            auth_module_1.AuthModule,
            users_module_1.UsersModule,
            products_module_1.ProductsModule,
            gifts_module_1.GiftsModule,
            confirmations_module_1.ConfirmationsModule,
            dashboard_module_1.DashboardModule,
            broadcast_module_1.BroadcastModule,
            upload_module_1.UploadModule,
            gift_orders_module_1.GiftOrdersModule,
            codes_module_1.CodesModule,
            print_module_1.PrintModule,
            codes_module_1.CodesModule,
            print_module_1.PrintModule,
        ],
    })
], AppModule);
//# sourceMappingURL=app.module.js.map