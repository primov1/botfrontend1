import { CanActivate, ExecutionContext } from '@nestjs/common';
import { AdminsService } from '../admins/admins.service';
export declare class SuperAdminGuard implements CanActivate {
    private readonly adminsService;
    constructor(adminsService: AdminsService);
    canActivate(context: ExecutionContext): Promise<boolean>;
}
