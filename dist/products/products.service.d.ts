import { Repository } from 'typeorm';
import { Product } from '../common/entities/product.entity';
export interface ProductDto {
    title?: string;
    image?: string;
    uzum_url?: string;
    bonus?: number | string;
    telegramChannel?: string;
    instagram?: string;
    requireChannel?: boolean | string;
}
export declare class ProductsService {
    private readonly productRepo;
    constructor(productRepo: Repository<Product>);
    list(q?: string, page?: number, limit?: number): Promise<{
        items: Product[];
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
    findById(id: number): Promise<Product>;
    private normalize;
    create(dto: ProductDto): Promise<Product>;
    update(id: number, dto: ProductDto): Promise<Product>;
    remove(id: number): Promise<Product>;
    count(): Promise<number>;
    topSoldProducts(): Promise<{
        id: number;
        title: string;
        sold: number;
        bonusTotal: number;
    }[]>;
    dailySalesStats(): Promise<{
        day: string;
        count: number;
        bonusTotal: number;
    }[]>;
}
