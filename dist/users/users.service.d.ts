import { DataSource, Repository } from 'typeorm';
import * as ExcelJS from 'exceljs';
import { User } from '../common/entities/user.entity';
import { Purchase } from '../common/entities/purchase.entity';
import { GiftPurchase } from '../common/entities/gift-purchase.entity';
export interface UpdateUserDto {
    firstName?: string;
    lastName?: string;
    phone?: string;
}
export interface UsersQuery {
    q?: string;
    page?: number;
    limit?: number;
}
export declare class UsersService {
    private readonly userRepo;
    private readonly purchaseRepo;
    private readonly giftPurchaseRepo;
    private readonly dataSource;
    constructor(userRepo: Repository<User>, purchaseRepo: Repository<Purchase>, giftPurchaseRepo: Repository<GiftPurchase>, dataSource: DataSource);
    list(query: UsersQuery): Promise<{
        items: User[];
        total: number;
        page: number;
        limit: number;
        totalPages: number;
        hasPrev: boolean;
        hasNext: boolean;
        prevPage: number;
        nextPage: number;
        q: string;
    }>;
    findById(id: number): Promise<User>;
    update(id: number, dto: UpdateUserDto): Promise<User>;
    delete(id: number): Promise<void>;
    count(): Promise<number>;
    registrationStats(): Promise<{
        day: string;
        count: number;
    }[]>;
    topBonusUsers(): Promise<{
        id: number;
        name: string;
        bonus: number;
        orders: number;
    }[]>;
    exportExcel(q?: string): Promise<ExcelJS.Buffer>;
    profile(id: number): Promise<{
        user: User;
        purchases: {
            id: number;
            bonus: number;
            quantity: number;
            status: "pending" | "approved" | "rejected";
            reviewSubmitted: boolean;
            proofImage: string;
            reviewComment: string;
            reviewNote: string;
            reviewedAt: Date | null;
            createdAt: Date;
            product: {
                id: number;
                title: string;
                uzum_url: string;
                bonus: number;
            } | null;
        }[];
        giftPurchases: {
            id: number;
            price: number;
            createdAt: Date;
            gift: {
                id: number;
                title: string;
                image: string;
                price: number;
            } | null;
        }[];
        totals: {
            purchases: number;
            giftPurchases: number;
            bonusEarned: number;
            bonusPending: number;
            bonusSpent: number;
            bonusBalance: number;
            pendingCount: number;
            approvedCount: number;
            rejectedCount: number;
        };
    }>;
}
