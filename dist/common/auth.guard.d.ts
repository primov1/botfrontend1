import { CanActivate, ExecutionContext } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
export declare const AUTH_COOKIE = "admin_token";
export interface AuthPayload {
    sub: string;
    role: 'admin';
    isSuper: boolean;
}
export declare class AdminAuthGuard implements CanActivate {
    private readonly jwt;
    constructor(jwt: JwtService);
    canActivate(context: ExecutionContext): boolean;
}
