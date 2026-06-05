import { OnModuleInit } from '@nestjs/common';
import { DataSource } from 'typeorm';
import type { Request } from 'express';
export declare class UploadImageService implements OnModuleInit {
    private readonly dataSource;
    private readonly logger;
    constructor(dataSource: DataSource);
    onModuleInit(): Promise<void>;
    save(buffer: Buffer, mime?: string): Promise<string>;
    get(id: string): Promise<{
        data: Buffer;
        mime: string;
    } | null>;
    buildUrl(req: Request, id: string): string;
}
