import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import type { Request, Response } from 'express';
import { ConfirmationsService } from './confirmations.service';
import { AdminsService } from '../admins/admins.service';
import { GiftOrdersService } from '../gift-orders/gift-orders.service';
import { parseCookies } from '../common/cookie.util';
import { LANG_COOKIE, normalizeLang } from '../common/i18n';

@Injectable()
export class PendingCountInterceptor implements NestInterceptor {
    constructor(
        private readonly confirmationsService: ConfirmationsService,
        private readonly adminsService: AdminsService,
        private readonly giftOrdersService: GiftOrdersService,
    ) {}

    async intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>> {
        if (context.getType() === 'http') {
            const req = context.switchToHttp().getRequest<Request>();
            const res = context.switchToHttp().getResponse<Response>();
            if (res?.locals) {
                // Joriy til (cookie'dan) — barcha shablonlar uchun
                const cookies = parseCookies(req.headers?.cookie);
                res.locals.lang = normalizeLang(cookies[LANG_COOKIE]);

                try {
                    res.locals.pendingConfirmations = await this.confirmationsService.pendingCount();
                } catch {
                    res.locals.pendingConfirmations = 0;
                }
                try {
                    res.locals.pendingGifts = await this.giftOrdersService.pendingCount();
                } catch {
                    res.locals.pendingGifts = 0;
                }
                // Joriy admin profili (sidebar/topbar uchun) — guard o'rnatgan req.admin'dan
                const login = (req as any).admin?.sub as string | undefined;
                if (login) {
                    const admin = await this.adminsService.findByLogin(login);
                    res.locals.adminProfile = admin ? AdminsService.toPublic(admin) : null;
                }
            }
        }
        return next.handle();
    }
}
