import { OnModuleInit } from '@nestjs/common';
import { DataSource, Repository } from 'typeorm';
import { Code } from '../common/entities/code.entity';
import { Product } from '../common/entities/product.entity';
export interface CodeFilter {
    productId?: number;
    isUsed?: boolean;
    expired?: boolean;
}
export declare class CodesService implements OnModuleInit {
    private readonly codeRepo;
    private readonly productRepo;
    private readonly dataSource;
    private readonly logger;
    constructor(codeRepo: Repository<Code>, productRepo: Repository<Product>, dataSource: DataSource);
    onModuleInit(): Promise<void>;
    private randomCode;
    generateCodes(productId: number, count: number): Promise<{
        count: number;
        codes: string[];
    }>;
    list(filter: CodeFilter, page?: number, limit?: number): Promise<{
        items: Code[];
        total: number;
        page: number;
        totalPages: number;
        limit: number;
    }>;
    exportToCsv(productId: number): Promise<{
        filename: string;
        content: string;
    }>;
    validateCode(code: string): Promise<Code | null>;
    markAsUsed(codeId: number, userId: number): Promise<boolean>;
    deleteUnused(id: number): Promise<void>;
    stats(productId: number): Promise<{
        total: number;
        used: number;
        unused: number;
    }>;
    findById(id: number): Promise<Code | null>;
    private readonly STICKER_KEY;
    private readonly STICKER_DEFAULT;
    getStickerText(): Promise<string>;
    setStickerText(text: string): Promise<void>;
    private readonly BOTNICK_KEY;
    getBotUsername(): Promise<string>;
    setBotUsername(nick: string): Promise<void>;
    private getSetting;
    private setSetting;
}
