import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request, Response } from 'express';
import { AdminsService } from '../admins/admins.service';

/**
 * Faqat super admin (birinchi admin) o'ta oladi.
 * AdminAuthGuard'dan KEYIN ishlatilishi kerak (u req.admin'ni o'rnatadi).
 */
@Injectable()
export class SuperAdminGuard implements CanActivate {
    constructor(private readonly adminsService: AdminsService) {}

    async canActivate(context: ExecutionContext): Promise<boolean> {
        const req = context.switchToHttp().getRequest<Request>();
        const res = context.switchToHttp().getResponse<Response>();
        const login = (req as any).admin?.sub as string | undefined;

        const admin = login ? await this.adminsService.findByLogin(login) : null;
        if (admin?.isSuper) return true;

        res.redirect('/');
        return false;
    }
}
