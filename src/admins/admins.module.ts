import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsService } from './admins.service';
import { SuperAdminGuard } from '../common/super-admin.guard';
import { Admin } from '../common/entities/admin.entity';
import { AppSetting } from '../common/entities/app-setting.entity';

// Bitta admin ishlatadi — "Adminlar" boshqaruv sahifasi (AdminsController) olib
// tashlandi. AdminsService login/profil/seed uchun qoladi.
@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Admin, AppSetting])],
    providers: [AdminsService, SuperAdminGuard],
    exports: [AdminsService, SuperAdminGuard],
})
export class AdminsModule {}
