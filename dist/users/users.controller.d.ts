import type { Response } from 'express';
import { UsersService } from './users.service';
export declare class UsersController {
    private readonly usersService;
    constructor(usersService: UsersService);
    list(q: string, page: string, limit: string, updated: string, res: Response): Promise<void>;
    export(q: string, res: Response): Promise<void>;
    show(id: number, msgSent: string, msgError: string, res: Response): Promise<void>;
    edit(id: number, res: Response): Promise<void>;
    update(id: number, firstName: string, lastName: string, phone: string, res: Response): Promise<void>;
    delete(id: number, res: Response): Promise<void>;
}
