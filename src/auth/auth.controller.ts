import {
    Body,
    Controller,
    Get,
    Param,
    Post,
    Res,
    Req,
    HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AdminsService } from '../admins/admins.service';
import { AUTH_COOKIE, type AuthPayload } from '../common/auth.guard';
import { parseCookies } from '../common/cookie.util';
import { LANG_COOKIE, normalizeLang } from '../common/i18n';

@Controller()
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly adminsService: AdminsService,
    ) {}

    @Get('login')
    async loginPage(@Req() req: Request, @Res() res: Response) {
        const cookies = parseCookies(req.headers.cookie);
        if (cookies[AUTH_COOKIE]) {
            return res.redirect('/');
        }
        // Telefon raqam faqat birinchi marta (super admin hali kiritmagan bo'lsa) so'raladi
        return res.render('login', {
            layout: false,
            title: 'Kirish',
            needPhone: await this.adminsService.superAdminLacksPhone(),
        });
    }

    @Post('login')
    async login(
        @Body('login') login: string,
        @Body('password') password: string,
        @Body('phone') phone: string,
        @Res() res: Response,
    ) {
        const phoneVal = (phone ?? '').trim();
        let payload: AuthPayload;
        try {
            payload = await this.authService.validate((login ?? '').trim(), password ?? '');
        } catch {
            return res.status(HttpStatus.UNAUTHORIZED).render('login', {
                layout: false,
                title: 'Kirish',
                needPhone: await this.adminsService.superAdminLacksPhone(),
                error: 'login_error',
                login,
            });
        }

        // Telefoni hali yo'q admin (birinchi marta) — raqam majburiy va eslab qolinadi
        const admin = await this.adminsService.findByLogin(payload.sub);
        if (admin && !admin.phone) {
            if (!phoneVal) {
                return res.status(HttpStatus.BAD_REQUEST).render('login', {
                    layout: false,
                    title: 'Kirish',
                    needPhone: true,
                    error: 'phone_required',
                    login,
                });
            }
            await this.adminsService.setPhone(admin.login, phoneVal);
        }

        const { token, ttl } = this.authService.sign(payload);
        res.cookie(AUTH_COOKIE, token, {
            httpOnly: true,
            sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ttl * 1000,
            path: '/',
        });
        return res.redirect('/');
    }

    @Get('logout')
    logout(@Res() res: Response) {
        res.clearCookie(AUTH_COOKIE, { path: '/' });
        return res.redirect('/login');
    }

    /** Til tanlash: cookie'ga saqlanadi va oldingi sahifaga qaytariladi. */
    @Get('lang/:lang')
    setLang(@Param('lang') lang: string, @Req() req: Request, @Res() res: Response) {
        res.cookie(LANG_COOKIE, normalizeLang(lang), {
            httpOnly: false,
            sameSite: 'lax',
            maxAge: 365 * 24 * 60 * 60 * 1000,
            path: '/',
        });
        const back = req.headers.referer || '/';
        return res.redirect(back);
    }
}
