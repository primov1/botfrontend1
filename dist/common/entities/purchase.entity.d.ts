import { User } from './user.entity';
import { Product } from './product.entity';
export declare const PURCHASE_STATUSES: readonly ["pending", "approved", "rejected"];
export type PurchaseStatus = (typeof PURCHASE_STATUSES)[number];
export declare class Purchase {
    id: number;
    userId: number;
    user: User;
    productId: number | null;
    product: Product;
    quantity: number;
    bonus: number;
    status: PurchaseStatus;
    reviewSubmitted: boolean;
    proofImage: string;
    reviewedAt: Date | null;
    reviewNote: string;
    createdAt: Date;
    updatedAt: Date;
}
