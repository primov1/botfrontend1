import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthPayload } from '../common/auth.guard';
import { AdminsService } from '../admins/admins.service';

@Injectable()
export class AuthService {
    constructor(
        private readonly config: ConfigService,
        private readonly jwt: JwtService,
        private readonly adminsService: AdminsService,
    ) {}

    async validate(login: string, password: string): Promise<AuthPayload> {
        const admin = await this.adminsService.validateCredentials(login, password);
        if (!admin) throw new UnauthorizedException("Login yoki parol noto'g'ri");
        return { sub: admin.login, role: 'admin', isSuper: admin.isSuper };
    }

    sign(payload: AuthPayload): { token: string; ttl: number } {
        const ttl = Number(this.config.get<string>('JWT_TTL', '86400'));
        // Maxfiy kalit JwtModule registratsiyasidan olinadi (resolveJwtSecret).
        const token = this.jwt.sign(payload, { expiresIn: ttl });
        return { token, ttl };
    }
}
