import { User } from './user.entity';
import { Gift } from './gift.entity';
export declare class GiftPurchase {
    id: number;
    userId: number;
    user: User;
    giftId: number | null;
    gift: Gift | null;
    price: number;
    status: 'pending' | 'approved' | 'rejected';
    delivered: boolean;
    createdAt: Date;
    updatedAt: Date;
}
