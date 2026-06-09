import {
    Body, Controller, Get, Post, Query, Req, Res, UseGuards,
    UploadedFile, UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import type { Request, Response } from 'express';
import { memoryStorage } from 'multer';
import { AdminAuthGuard } from '../common/auth.guard';
import { AdminsService } from '../admins/admins.service';
import { AuthService } from './auth.service';
import { AUTH_COOKIE } from '../common/auth.guard';
import { UploadImageService } from '../upload/upload-image.service';
import sharp from 'sharp';

@Controller('admin/profile')
@UseGuards(AdminAuthGuard)
export class AdminProfileController {
    constructor(
        private readonly adminsService: AdminsService,
        private readonly authService: AuthService,
        private readonly uploadImage: UploadImageService,
    ) {}

    private currentLogin(req: Request): string {
        return ((req as any).admin?.sub as string) ?? '';
    }

    @Get()
    async show(@Req() req: Request, @Query() query: Record<string, string>, @Res() res: Response) {
        const admin = await this.adminsService.findByLogin(this.currentLogin(req));
        return res.render('admin-profile', {
            title: 'Admin profil', active: 'admin-profile',
            profile: admin ? AdminsService.toPublic(admin) : null, query,
        });
    }

    @Post('name')
    async updateName(@Req() req: Request, @Body('name') name: string, @Res() res: Response) {
        const t = (name ?? '').trim();
        if (!t) return res.redirect('/admin/profile?name_error=1');
        await this.adminsService.updateName(this.currentLogin(req), t);
        return res.redirect('/admin/profile?name_ok=1');
    }

    @Post('credentials')
    async updateCredentials(
        @Req() req: Request,
        @Body('currentPassword') currentPassword: string,
        @Body('newLogin') newLogin: string,
        @Body('newPassword') newPassword: string,
        @Body('confirmPassword') confirmPassword: string,
        @Body('phone') phone: string,
        @Res() res: Response,
    ) {
        const login = this.currentLogin(req);

        const admin = await this.adminsService.validateCredentials(login, currentPassword ?? '');
        if (!admin) return res.redirect('/admin/profile?cred_error=wrong_current');

        const loginVal = (newLogin ?? '').trim();
        const passVal  = (newPassword ?? '').trim();
        const phoneVal = (phone ?? '').trim();

        if (!loginVal || loginVal.length < 3)
            return res.redirect('/admin/profile?cred_error=login_short');

        if (!phoneVal)
            return res.redirect('/admin/profile?cred_error=phone_required');

        if (passVal) {
            if (passVal.length < 6)
                return res.redirect('/admin/profile?cred_error=pass_short');
            if (passVal !== (confirmPassword ?? '').trim())
                return res.redirect('/admin/profile?cred_error=pass_mismatch');
        }

        let updatedLogin: string;
        try {
            updatedLogin = await this.adminsService.applyProfileUpdate(login, {
                newLogin: loginVal,
                phone: phoneVal,
                newPassword: passVal || undefined,
            });
        } catch (err: any) {
            if (err?.message === 'login_taken')
                return res.redirect('/admin/profile?cred_error=login_taken');
            return res.redirect('/admin/profile?cred_error=unknown');
        }

        // Login (JWT sub) o'zgargan bo'lishi mumkin — cookie'ni qayta imzolaymiz
        const { token, ttl } = this.authService.sign({
            sub: updatedLogin, role: 'admin', isSuper: admin.isSuper,
        });
        res.cookie(AUTH_COOKIE, token, {
            httpOnly: true, sameSite: 'lax',
            secure: process.env.NODE_ENV === 'production',
            maxAge: ttl * 1000, path: '/',
        });
        return res.redirect('/admin/profile?cred_ok=1');
    }

    @Post('avatar')
    @UseInterceptors(FileInterceptor('avatar', {
        storage: memoryStorage(),
        limits: { fileSize: 5 * 1024 * 1024 },
        fileFilter: (_req, file, cb) => {
            cb(null, ['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype));
        },
    }))
    async uploadAvatar(@Req() _req: Request, @UploadedFile() file: Express.Multer.File, @Res() res: Response) {
        if (!file) return res.redirect('/admin/profile?avatar_error=invalid_file');
        try {
            const resized = await sharp(file.buffer)
                .resize(200, 200, { fit: 'cover' })
                .jpeg({ quality: 85 })
                .toBuffer();

            const url = await this.uploadImage.upload(resized);
            if (!url) return res.redirect('/admin/profile?avatar_error=imgbb_key_missing');
            await this.adminsService.setAvatar(this.currentLogin(_req), url);
            return res.redirect('/admin/profile?avatar_ok=1');
        } catch {
            return res.redirect('/admin/profile?avatar_error=processing');
        }
    }

    @Post('avatar/remove')
    async removeAvatar(@Req() req: Request, @Res() res: Response) {
        await this.adminsService.removeAvatar(this.currentLogin(req));
        return res.redirect('/admin/profile?avatar_removed=1');
    }
}
