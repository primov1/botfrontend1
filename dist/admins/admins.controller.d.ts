import type { Response } from 'express';
import { AdminsService } from './admins.service';
export declare class AdminsController {
    private readonly adminsService;
    constructor(adminsService: AdminsService);
    list(query: Record<string, string>, res: Response): Promise<void>;
    setLimit(max: string, res: Response): Promise<void>;
    create(login: string, password: string, name: string, phone: string, res: Response): Promise<void>;
    remove(id: number, res: Response): Promise<void>;
}
