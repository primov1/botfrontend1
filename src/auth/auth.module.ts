import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from '../common/auth.guard';
import { AdminProfileService } from './admin-profile.service';
import { AdminProfileController } from './admin-profile.controller';
import { AppSetting } from '../common/entities/app-setting.entity';
import { resolveJwtSecret } from '../common/jwt.config';

@Global()
@Module({
    imports: [
        TypeOrmModule.forFeature([AppSetting]),
        JwtModule.registerAsync({
            imports: [ConfigModule],
            inject: [ConfigService],
            useFactory: (config: ConfigService) => ({
                secret: resolveJwtSecret(config),
                signOptions: {
                    expiresIn: Number(config.get<string>('JWT_TTL', '86400')),
                },
            }),
        }),
    ],
    controllers: [AuthController, AdminProfileController],
    providers: [AuthService, AdminAuthGuard, AdminProfileService],
    exports: [AuthService, AdminAuthGuard, JwtModule, AdminProfileService],
})
export class AuthModule {}
