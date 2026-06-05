import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { ConfirmationsService } from './confirmations.service';
import { AdminsService } from '../admins/admins.service';
import { GiftOrdersService } from '../gift-orders/gift-orders.service';
export declare class PendingCountInterceptor implements NestInterceptor {
    private readonly confirmationsService;
    private readonly adminsService;
    private readonly giftOrdersService;
    constructor(confirmationsService: ConfirmationsService, adminsService: AdminsService, giftOrdersService: GiftOrdersService);
    intercept(context: ExecutionContext, next: CallHandler): Promise<Observable<unknown>>;
}
