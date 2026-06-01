import {
    Body, Controller, Get, Param, ParseIntPipe, Post, Query, Res, UseGuards,
} from '@nestjs/common';
import type { Response } from 'express';
import { AdminsService } from './admins.service';
import { AdminAuthGuard } from '../common/auth.guard';
import { SuperAdminGuard } from '../common/super-admin.guard';

@Controller('admins')
@UseGuards(AdminAuthGuard, SuperAdminGuard)
export class AdminsController {
    constructor(private readonly adminsService: AdminsService) {}

    @Get()
    async list(@Query() query: Record<string, string>, @Res() res: Response) {
        const [admins, max] = await Promise.all([
            this.adminsService.list(),
            this.adminsService.getMaxAdmins(),
        ]);
        return res.render('admins', {
            title: 'Adminlar',
            active: 'admins',
            admins: admins.map(AdminsService.toPublic),
            count: admins.length,
            max,
            limitReached: admins.length >= max,
            query,
        });
    }

    @Post('limit')
    async setLimit(@Body('max') max: string, @Res() res: Response) {
        try {
            await this.adminsService.setMaxAdmins(Number(max));
            return res.redirect('/admins?limit_ok=1');
        } catch (err: any) {
            return res.redirect('/admins?error=' + encodeURIComponent(err?.message || 'Xatolik'));
        }
    }

    @Post('new')
    async create(
        @Body('login') login: string,
        @Body('password') password: string,
        @Body('name') name: string,
        @Body('phone') phone: string,
        @Res() res: Response,
    ) {
        try {
            await this.adminsService.createAdmin({ login, password, name, phone });
            return res.redirect('/admins?created=1');
        } catch (err: any) {
            return res.redirect('/admins?error=' + encodeURIComponent(err?.message || 'Xatolik'));
        }
    }

    @Post(':id/delete')
    async remove(@Param('id', ParseIntPipe) id: number, @Res() res: Response) {
        try {
            await this.adminsService.deleteAdmin(id);
            return res.redirect('/admins?deleted=1');
        } catch (err: any) {
            return res.redirect('/admins?error=' + encodeURIComponent(err?.message || 'Xatolik'));
        }
    }
}
