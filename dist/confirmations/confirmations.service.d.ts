import { Telegraf } from 'telegraf';
import { DataSource, Repository } from 'typeorm';
import { Purchase, PurchaseStatus } from '../common/entities/purchase.entity';
import { User } from '../common/entities/user.entity';
import { Code } from '../common/entities/code.entity';
export type StatusFilter = PurchaseStatus | 'all';
export declare class ConfirmationsService {
    private readonly purchaseRepo;
    private readonly userRepo;
    private readonly codeRepo;
    private readonly bot;
    private readonly dataSource;
    private readonly logger;
    constructor(purchaseRepo: Repository<Purchase>, userRepo: Repository<User>, codeRepo: Repository<Code>, bot: Telegraf, dataSource: DataSource);
    counts(): Promise<{
        pending: number;
        approved: number;
        rejected: number;
        total: number;
    }>;
    pendingCount(): Promise<number>;
    list(status: string | undefined, page?: number, limit?: number): Promise<{
        items: {
            id: number;
            bonus: number;
            quantity: number;
            status: "pending" | "approved" | "rejected";
            reviewSubmitted: boolean;
            proofImage: string;
            reviewNote: string;
            reviewedAt: Date | null;
            createdAt: Date;
            user: {
                id: number;
                firstName: string;
                lastName: string;
                phone: string;
                username: string;
            } | null;
            product: {
                id: number;
                title: string;
                uzum_url: string;
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
        status: StatusFilter;
        counts: {
            pending: number;
            approved: number;
            rejected: number;
            total: number;
        };
    }>;
    delete(id: number): Promise<void>;
    private setStatus;
    private notifyUser;
    approve(id: number): Promise<Purchase>;
    reject(id: number, note?: string): Promise<Purchase>;
}
