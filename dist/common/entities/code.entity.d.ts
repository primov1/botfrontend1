export declare class Code {
    id: number;
    code: string;
    productId: number;
    points: number;
    isUsed: boolean;
    usedByUserId: number | null;
    usedAt: Date | null;
    expiresAt: Date;
    createdAt: Date;
}
