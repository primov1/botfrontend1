import { Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { InjectBot } from 'nestjs-telegraf';
import { Telegraf } from 'telegraf';
import { User } from '../common/entities/user.entity';

export interface BroadcastResult {
    total: number;
    sent: number;
    failed: number;
}

@Injectable()
export class BroadcastService {
    private readonly logger = new Logger(BroadcastService.name);

    constructor(
        @InjectRepository(User)
        private readonly userRepo: Repository<User>,
        @InjectBot()
        private readonly bot: Telegraf,
    ) {}

    async sendToAll(message: string): Promise<BroadcastResult> {
        const users = await this.userRepo.find({
            where: { isActive: true },
            select: ['id', 'telegramId'],
        });

        let sent = 0;
        let failed = 0;

        for (const user of users) {
            if (!user.telegramId) { failed++; continue; }
            if (await this.deliver(user.telegramId, message)) {
                sent++;
            } else {
                failed++;
            }
            // Telegram rate limit: 30 msg/sec
            await new Promise((r) => setTimeout(r, 50));
        }

        return { total: users.length, sent, failed };
    }

    async sendToOne(telegramId: number, message: string): Promise<boolean> {
        return this.deliver(telegramId, message);
    }

    /**
     * Xabarni avval HTML sifatida yuboradi. Agar admin matnida HTML noto'g'ri
     * bo'lsa (Telegram "can't parse entities" xatosi), xabar yo'qolib ketmasligi
     * uchun oddiy matn sifatida qayta yuboradi.
     */
    private async deliver(telegramId: number, message: string): Promise<boolean> {
        try {
            await this.bot.telegram.sendMessage(telegramId, message, { parse_mode: 'HTML' });
            return true;
        } catch (err) {
            const msg = (err as Error).message ?? '';
            if (/parse|entities/i.test(msg)) {
                try {
                    await this.bot.telegram.sendMessage(telegramId, message);
                    return true;
                } catch (err2) {
                    this.logger.warn(`Yuborilmadi (telegramId=${telegramId}): ${(err2 as Error).message}`);
                    return false;
                }
            }
            this.logger.warn(`Yuborilmadi (telegramId=${telegramId}): ${msg}`);
            return false;
        }
    }
}
