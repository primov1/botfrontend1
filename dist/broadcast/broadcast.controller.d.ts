import type { Response } from 'express';
import { BroadcastService } from './broadcast.service';
import { UsersService } from '../users/users.service';
export declare class BroadcastController {
    private readonly broadcastService;
    private readonly usersService;
    constructor(broadcastService: BroadcastService, usersService: UsersService);
    showForm(res: Response): void;
    sendToAll(message: string, res: Response): Promise<void>;
    sendToOne(id: number, message: string, res: Response): Promise<void>;
}
