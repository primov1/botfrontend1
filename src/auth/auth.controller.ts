import {
    Body,
    Controller,
    Get,
    Post,
    Res,
    Req,
    HttpStatus,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { AuthService } from './auth.service';
import { AdminProfileService } from './admin-profile.service';
import { AUTH_COOKIE } from '../common/auth.guard';
import { parseCookies } from '../common/cookie.util';

@Controller()
export class AuthController {
    constructor(
        private readonly authService: AuthService,
        private readonly profileService: AdminProfileService,
    ) {}

    @Get('login')
    loginPage(@Req() req: Request, @Res() res: Response) {
        const cookies = parseCookies(req.headers.cookie);
        if (cookies[AUTH_COOKIE]) {
            return res.redirect('/');
        }
        // Telefon raqam faqat hali saqlanmagan bo'lsa (birinchi marta) so'raladi
        return res.render('login', {
            layout: false,
            title: 'Kirish',
            needPhone: !this.profileService.getPhone(),
        });
    }

    @Post('login')
    login(
        @Body('login') login: string,
        @Body('password') password: string,
        @Body('phone') phone: string,
        @Res() res: Response,
    ) {
        const needPhone = !this.profileService.getPhone();
        const phoneVal = (phone ?? '').trim();

        try {
            const payload = this.authService.validate(
                (login ?? '').trim(),
                password ?? '',
            );

            // Birinchi marta — telefon raqam majburiy va eslab qolinadi
            if (needPhone && !phoneVal) {
                return res.status(HttpStatus.BAD_REQUEST).render('login', {
                    layout: false,
                    title: 'Kirish',
                    needPhone: true,
                    error: 'Telefon raqamingizni kiriting',
                    login,
                });
            }
            if (needPhone) {
                this.profileService.updatePhone(phoneVal);
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
        } catch {
            return res.status(HttpStatus.UNAUTHORIZED).render('login', {
                layout: false,
                title: 'Kirish',
                needPhone,
                error: "Login yoki parol noto'g'ri",
                login,
            });
        }
    }

    @Get('logout')
    logout(@Res() res: Response) {
        res.clearCookie(AUTH_COOKIE, { path: '/' });
        return res.redirect('/login');
    }
}
