import type { Response } from 'express';
import { ConfirmationsService } from './confirmations.service';
export declare class ConfirmationsController {
    private readonly confirmationsService;
    constructor(confirmationsService: ConfirmationsService);
    count(): Promise<{
        pending: number;
    }>;
    list(status: string, page: string, limit: string, approved: string, rejected: string, res: Response): Promise<void>;
    approve(id: number, status: string, res: Response): Promise<void>;
    reject(id: number, note: string, status: string, res: Response): Promise<void>;
    remove(id: number, status: string, res: Response): Promise<void>;
    private backUrl;
}
