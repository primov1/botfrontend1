import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { AppSetting } from '../common/entities/app-setting.entity';

export interface AdminProfile {
    login: string;
    avatar: string | null;
    name: string;
}

const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = '$2';
const DEFAULT_PASSWORD = '12345678';

const KEY_LOGIN = 'admin_login';
const KEY_PASSWORD = 'admin_password_hash';
const KEY_NAME = 'admin_name';
const KEY_AVATAR = 'admin_avatar';

/**
 * Admin profili. Standart qiymatlar muhit o'zgaruvchilaridan olinadi,
 * keyin DB'dagi (app_settings) saqlangan o'zgarishlar ustiga qo'yiladi.
 * Shu tariqa profil o'zgarishlari restart/deploy'dan keyin ham saqlanib qoladi
 * (eski versiyada .env fayliga yozilar edi — bu serverless/Railway'da yo'qolardi).
 */
@Injectable()
export class AdminProfileService implements OnModuleInit {
    private readonly logger = new Logger(AdminProfileService.name);
    private currentLogin: string;
    private currentPasswordHash: string;
    private currentName: string;
    private currentAvatar: string | null = null;

    constructor(
        private readonly config: ConfigService,
        @InjectRepository(AppSetting)
        private readonly settingsRepo: Repository<AppSetting>,
        private readonly dataSource: DataSource,
    ) {
        // 1-bosqich: env'dan standart qiymatlar (DB bo'sh bo'lsa shular ishlatiladi)
        this.currentLogin = this.config.get<string>('ADMIN_LOGIN', 'admin');
        this.currentName = this.config.get<string>('ADMIN_NAME', 'Administrator');

        const storedPassword = this.config.get<string>('ADMIN_PASSWORD', DEFAULT_PASSWORD);
        this.currentPasswordHash = storedPassword.startsWith(BCRYPT_PREFIX)
            ? storedPassword
            : bcrypt.hashSync(storedPassword, BCRYPT_ROUNDS);

        const avatarUrl = this.config.get<string>('ADMIN_AVATAR', '');
        this.currentAvatar = avatarUrl || null;
    }

    async onModuleInit(): Promise<void> {
        await this.ensureTable();
        await this.loadFromDb();

        // Xavfsizlik ogohlantirishi: production'da standart parol qolib ketgan bo'lsa
        if (
            this.config.get<string>('NODE_ENV') === 'production' &&
            bcrypt.compareSync(DEFAULT_PASSWORD, this.currentPasswordHash)
        ) {
            this.logger.warn(
                '⚠️  Admin paroli hali ham standart "12345678" — uni almashtiring ' +
                '(profil sahifasidan yoki ADMIN_PASSWORD muhit o\'zgaruvchisi orqali).',
            );
        }
    }

    getLogin(): string { return this.currentLogin; }

    getProfile(): AdminProfile {
        return { login: this.currentLogin, avatar: this.currentAvatar, name: this.currentName };
    }

    validatePassword(password: string): boolean {
        return bcrypt.compareSync(password, this.currentPasswordHash);
    }

    updateLogin(newLogin: string): void {
        this.currentLogin = newLogin.trim();
        this.save(KEY_LOGIN, this.currentLogin);
    }

    updatePassword(newPassword: string): void {
        this.currentPasswordHash = bcrypt.hashSync(newPassword, BCRYPT_ROUNDS);
        this.save(KEY_PASSWORD, this.currentPasswordHash);
    }

    updateName(newName: string): void {
        this.currentName = newName.trim();
        this.save(KEY_NAME, this.currentName);
    }

    saveAvatar(url: string): void {
        this.currentAvatar = url;
        this.save(KEY_AVATAR, url);
    }

    removeAvatar(): void {
        this.currentAvatar = null;
        this.save(KEY_AVATAR, '');
    }

    /**
     * app_settings jadvali mavjudligini kafolatlaydi.
     * Production'da synchronize=false bo'lgani uchun jadval avtomatik yaratilmaydi —
     * shuning uchun uni qo'lda (IF NOT EXISTS) yaratamiz.
     */
    private async ensureTable(): Promise<void> {
        try {
            await this.dataSource.query(
                'CREATE TABLE IF NOT EXISTS "app_settings" ' +
                '("key" varchar PRIMARY KEY, "value" text NOT NULL DEFAULT \'\')',
            );
        } catch (err) {
            this.logger.warn(`app_settings jadvalini tayyorlab bo'lmadi: ${(err as Error).message}`);
        }
    }

    private async loadFromDb(): Promise<void> {
        try {
            const rows = await this.settingsRepo.find();
            const map = new Map(rows.map((r) => [r.key, r.value]));

            const login = map.get(KEY_LOGIN);
            const passwordHash = map.get(KEY_PASSWORD);
            const name = map.get(KEY_NAME);

            if (login) this.currentLogin = login;
            if (passwordHash) this.currentPasswordHash = passwordHash;
            if (name) this.currentName = name;
            if (map.has(KEY_AVATAR)) this.currentAvatar = map.get(KEY_AVATAR) || null;
        } catch (err) {
            this.logger.warn(`Profil sozlamalarini o'qib bo'lmadi: ${(err as Error).message}`);
        }
    }

    private save(key: string, value: string): void {
        // Fire-and-forget: javobni kutmaymiz, lekin xatoni log qilamiz.
        this.settingsRepo
            .upsert({ key, value }, ['key'])
            .catch((err) =>
                this.logger.warn(`Sozlama saqlanmadi (${key}): ${(err as Error).message}`),
            );
    }
}
