import type { Response } from 'express';
import { GiftOrdersService } from './gift-orders.service';
export declare class GiftOrdersController {
    private readonly giftOrders;
    constructor(giftOrders: GiftOrdersService);
    count(): Promise<{
        pending: number;
    }>;
    list(filter: string, page: string, ok: string, res: Response): Promise<void>;
    approve(id: number, filter: string, res: Response): Promise<void>;
    reject(id: number, filter: string, res: Response): Promise<void>;
    deliver(id: number, filter: string, res: Response): Promise<void>;
    remove(id: number, filter: string, res: Response): Promise<void>;
}
