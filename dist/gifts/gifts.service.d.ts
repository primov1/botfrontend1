import { DataSource, Repository } from 'typeorm';
import { Gift } from '../common/entities/gift.entity';
export interface GiftDto {
    title?: string;
    image?: string;
    price?: number | string;
}
export declare class GiftsService {
    private readonly giftRepo;
    private readonly dataSource;
    constructor(giftRepo: Repository<Gift>, dataSource: DataSource);
    list(q?: string, page?: number, limit?: number): Promise<{
        items: Gift[];
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
    findById(id: number): Promise<Gift>;
    private normalize;
    create(dto: GiftDto): Promise<Gift>;
    update(id: number, dto: GiftDto): Promise<Gift>;
    remove(id: number): Promise<Gift>;
    count(): Promise<number>;
    getSetting(key: string): Promise<string>;
    setSetting(key: string, value: string): Promise<void>;
}
