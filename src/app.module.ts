import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TelegrafModule } from 'nestjs-telegraf';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { ProductsModule } from './products/products.module';
import { GiftsModule } from './gifts/gifts.module';
import { ConfirmationsModule } from './confirmations/confirmations.module';
import { DashboardModule } from './dashboard/dashboard.module';
import { BroadcastModule } from './broadcast/broadcast.module';
import { UploadModule } from './upload/upload.module';
import { GiftOrdersModule } from './gift-orders/gift-orders.module';
import { CodesModule } from './codes/codes.module';
import { PrintModule } from './print/print.module';
import { Code } from './common/entities/code.entity';
import { User } from './common/entities/user.entity';
import { Product } from './common/entities/product.entity';
import { Gift } from './common/entities/gift.entity';
import { Purchase } from './common/entities/purchase.entity';
import { GiftPurchase } from './common/entities/gift-purchase.entity';
import { AppSetting } from './common/entities/app-setting.entity';
import { Admin } from './common/entities/admin.entity';
import { AdminsModule } from './admins/admins.module';

@Module({
    imports: [
        ConfigModule.forRoot({ isGlobal: true }),
        TypeOrmModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => {
                const url = config.get<string>('DATABASE_URL');
                // SSL: DB_SSL=false bo'lsa o'chiriladi; aks holda production yoki
                // DB_SSL=true bo'lsa yoqiladi (Neon majburiy, Railway ham qo'llab-quvvatlaydi).
                const ssl =
                    config.get<string>('DB_SSL') !== 'false' &&
                    (config.get<string>('NODE_ENV') === 'production' ||
                        config.get<string>('DB_SSL') === 'true')
                        ? { rejectUnauthorized: false }
                        : false;
                const base = {
                    type: 'postgres' as const,
                    entities: [User, Product, Gift, Purchase, GiftPurchase, AppSetting, Admin, Code],
                    synchronize: config.get<string>('NODE_ENV') !== 'production',
                    logging: config.get<string>('NODE_ENV') === 'development',
                    ssl,
                };
                // DATABASE_URL berilsa — uni ishlatamiz (bot_backend bilan bir xil),
                // aks holda alohida DB_* qiymatlari.
                return url
                    ? { ...base, url }
                    : {
                          ...base,
                          host: config.get<string>('DB_HOST', 'localhost'),
                          port: config.get<number>('DB_PORT', 5432),
                          username: config.get<string>('DB_USERNAME', 'postgres'),
                          password: config.get<string>('DB_PASSWORD', ''),
                          database: config.get<string>('DB_NAME', 'bot_loyiha'),
                      };
            },
        }),
        TelegrafModule.forRootAsync({
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                token: config.get<string>('BOT_TOKEN') ?? '',
                launchOptions: false,
            }),
        }),
        AdminsModule,
        AuthModule,
        UsersModule,
        ProductsModule,
        GiftsModule,
        ConfirmationsModule,
        DashboardModule,
        BroadcastModule,
        UploadModule,
        GiftOrdersModule,
        CodesModule,
        PrintModule,
    ],
})
export class AppModule {}
