import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import type { AuthPayload } from '../common/auth.guard';
import { AdminsService } from '../admins/admins.service';
export declare class AuthService {
    private readonly config;
    private readonly jwt;
    private readonly adminsService;
    constructor(config: ConfigService, jwt: JwtService, adminsService: AdminsService);
    validate(login: string, password: string): Promise<AuthPayload>;
    sign(payload: AuthPayload): {
        token: string;
        ttl: number;
    };
}
