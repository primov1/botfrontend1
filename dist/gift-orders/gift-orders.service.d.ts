import { OnModuleInit } from '@nestjs/common';
import { Telegraf } from 'telegraf';
import { DataSource, Repository } from 'typeorm';
import { GiftPurchase } from '../common/entities/gift-purchase.entity';
export type GiftStatus = 'pending' | 'approved' | 'rejected';
export declare class GiftOrdersService implements OnModuleInit {
    private readonly giftPurchaseRepo;
    private readonly bot;
    private readonly dataSource;
    private readonly logger;
    constructor(giftPurchaseRepo: Repository<GiftPurchase>, bot: Telegraf, dataSource: DataSource);
    onModuleInit(): Promise<void>;
    pendingCount(): Promise<number>;
    counts(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        all: number;
    }>;
    list(page?: number, limit?: number, filter?: GiftStatus | 'all'): Promise<{
        items: {
            id: number;
            price: number;
            status: "pending" | "approved" | "rejected";
            delivered: boolean;
            createdAt: Date;
            user: {
                id: number;
                firstName: string;
                lastName: string;
                phone: string;
            } | null;
            gift: {
                id: number;
                title: string;
                image: string;
            } | null;
        }[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasPrev: boolean;
        hasNext: boolean;
        prevPage: number;
        nextPage: number;
        filter: "all" | GiftStatus;
        counts: {
            pending: number;
            approved: number;
            rejected: number;
            all: number;
        };
    }>;
    approve(id: number): Promise<void>;
    reject(id: number): Promise<void>;
    setDelivered(id: number, delivered: boolean): Promise<void>;
    delete(id: number): Promise<void>;
    private getSetting;
    private notify;
}
