"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var BroadcastService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.BroadcastService = void 0;
const common_1 = require("@nestjs/common");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const nestjs_telegraf_1 = require("nestjs-telegraf");
const telegraf_1 = require("telegraf");
const user_entity_1 = require("../common/entities/user.entity");
let BroadcastService = BroadcastService_1 = class BroadcastService {
    userRepo;
    bot;
    logger = new common_1.Logger(BroadcastService_1.name);
    constructor(userRepo, bot) {
        this.userRepo = userRepo;
        this.bot = bot;
    }
    async sendToAll(message) {
        const users = await this.userRepo.find({
            where: { isActive: true },
            select: ['id', 'telegramId'],
        });
        let sent = 0;
        let failed = 0;
        for (const user of users) {
            if (!user.telegramId) {
                failed++;
                continue;
            }
            if (await this.deliver(user.telegramId, message)) {
                sent++;
            }
            else {
                failed++;
            }
            await new Promise((r) => setTimeout(r, 50));
        }
        return { total: users.length, sent, failed };
    }
    async sendToOne(telegramId, message) {
        return this.deliver(telegramId, message);
    }
    async deliver(telegramId, message) {
        try {
            await this.bot.telegram.sendMessage(telegramId, message, { parse_mode: 'HTML' });
            return true;
        }
        catch (err) {
            const msg = err.message ?? '';
            if (/parse|entities/i.test(msg)) {
                try {
                    await this.bot.telegram.sendMessage(telegramId, message);
                    return true;
                }
                catch (err2) {
                    this.logger.warn(`Yuborilmadi (telegramId=${telegramId}): ${err2.message}`);
                    return false;
                }
            }
            this.logger.warn(`Yuborilmadi (telegramId=${telegramId}): ${msg}`);
            return false;
        }
    }
};
exports.BroadcastService = BroadcastService;
exports.BroadcastService = BroadcastService = BroadcastService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(user_entity_1.User)),
    __param(1, (0, nestjs_telegraf_1.InjectBot)()),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        telegraf_1.Telegraf])
], BroadcastService);
//# sourceMappingURL=broadcast.service.js.map