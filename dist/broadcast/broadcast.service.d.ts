import { Repository } from 'typeorm';
import { Telegraf } from 'telegraf';
import { User } from '../common/entities/user.entity';
export interface BroadcastResult {
    total: number;
    sent: number;
    failed: number;
}
export declare class BroadcastService {
    private readonly userRepo;
    private readonly bot;
    private readonly logger;
    constructor(userRepo: Repository<User>, bot: Telegraf);
    sendToAll(message: string): Promise<BroadcastResult>;
    sendToOne(telegramId: number, message: string): Promise<boolean>;
    private deliver;
}
