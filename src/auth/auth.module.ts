import { Module, Global } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { AdminAuthGuard } from '../common/auth.guard';
import { AdminProfileController } from './admin-profile.controller';
import { resolveJwtSecret } from '../common/jwt.config';

@Global()
@Module({
    imports: [
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
    providers: [AuthService, AdminAuthGuard],
    exports: [AuthService, AdminAuthGuard, JwtModule],
})
export class AuthModule {}
