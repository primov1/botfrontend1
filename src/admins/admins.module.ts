import { Global, Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AdminsService } from './admins.service';
import { AdminsController } from './admins.controller';
import { SuperAdminGuard } from '../common/super-admin.guard';
import { Admin } from '../common/entities/admin.entity';
import { AppSetting } from '../common/entities/app-setting.entity';

@Global()
@Module({
    imports: [TypeOrmModule.forFeature([Admin, AppSetting])],
    controllers: [AdminsController],
    providers: [AdminsService, SuperAdminGuard],
    exports: [AdminsService, SuperAdminGuard],
})
export class AdminsModule {}
