import {
    BadRequestException,
    ForbiddenException,
    Injectable,
    Logger,
    NotFoundException,
    OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Admin } from '../common/entities/admin.entity';
import { AppSetting } from '../common/entities/app-setting.entity';

const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = '$2';
const DEFAULT_PASSWORD = '12345678';
const KEY_MAX_ADMINS = 'max_admins';
const DEFAULT_MAX_ADMINS = 3;

export interface PublicAdmin {
    id: number;
    login: string;
    name: string;
    phone: string;
    avatar: string | null;
    isSuper: boolean;
    createdAt: Date;
}

@Injectable()
export class AdminsService implements OnModuleInit {
    private readonly logger = new Logger(AdminsService.name);

    constructor(
        @InjectRepository(Admin)
        private readonly adminRepo: Repository<Admin>,
        @InjectRepository(AppSetting)
        private readonly settingsRepo: Repository<AppSetting>,
        private readonly dataSource: DataSource,
        private readonly config: ConfigService,
    ) {}

    async onModuleInit(): Promise<void> {
        await this.ensureTables();
        await this.seedSuperAdmin();
    }

    static toPublic(a: Admin): PublicAdmin {
        return {
            id: a.id,
            login: a.login,
            name: a.name,
            phone: a.phone,
            avatar: a.avatar,
            isSuper: a.isSuper,
            createdAt: a.createdAt,
        };
    }

    // ===== Kirish / topish =====

    findByLogin(login: string): Promise<Admin | null> {
        return this.adminRepo.findOne({ where: { login: (login ?? '').trim() } });
    }

    async validateCredentials(login: string, password: string): Promise<Admin | null> {
        const admin = await this.findByLogin(login);
        if (!admin) return null;
        return bcrypt.compareSync(password ?? '', admin.passwordHash) ? admin : null;
    }

    list(): Promise<Admin[]> {
        return this.adminRepo.find({ order: { isSuper: 'DESC', createdAt: 'ASC' } });
    }

    count(): Promise<number> {
        return this.adminRepo.count();
    }

    async superAdminLacksPhone(): Promise<boolean> {
        const sup = await this.adminRepo.findOne({ where: { isSuper: true } });
        return !sup?.phone;
    }

    // ===== Limit (max admin soni) =====

    async getMaxAdmins(): Promise<number> {
        const row = await this.settingsRepo.findOne({ where: { key: KEY_MAX_ADMINS } });
        const v = Number(row?.value);
        return Number.isFinite(v) && v >= 1 ? v : DEFAULT_MAX_ADMINS;
    }

    async setMaxAdmins(n: number): Promise<void> {
        const val = Math.floor(n);
        if (!Number.isFinite(val) || val < 1) {
            throw new BadRequestException("Limit kamida 1 bo'lishi kerak");
        }
        const current = await this.count();
        if (val < current) {
            throw new BadRequestException(
                `Limit hozirgi adminlar sonidan (${current}) kam bo'lmasligi kerak`,
            );
        }
        await this.settingsRepo.upsert({ key: KEY_MAX_ADMINS, value: String(val) }, ['key']);
    }

    // ===== Admin qo'shish / o'chirish (super admin) =====

    async createAdmin(input: {
        login: string;
        password: string;
        name?: string;
        phone: string;
    }): Promise<Admin> {
        const login = (input.login ?? '').trim();
        const phone = (input.phone ?? '').trim();
        const name = (input.name ?? '').trim() || login;

        if (login.length < 3) throw new BadRequestException("Login kamida 3 ta belgi bo'lishi kerak");
        if ((input.password ?? '').length < 6) throw new BadRequestException("Parol kamida 6 ta belgi bo'lishi kerak");
        if (!phone) throw new BadRequestException('Telefon raqam majburiy');

        if (await this.findByLogin(login)) {
            throw new BadRequestException('Bu login allaqachon band');
        }

        const max = await this.getMaxAdmins();
        const count = await this.count();
        if (count >= max) {
            throw new BadRequestException(`Admin limiti to'ldi (maksimal: ${max})`);
        }

        const admin = this.adminRepo.create({
            login,
            passwordHash: bcrypt.hashSync(input.password, BCRYPT_ROUNDS),
            name,
            phone,
            avatar: null,
            isSuper: false,
        });
        return this.adminRepo.save(admin);
    }

    async deleteAdmin(id: number): Promise<void> {
        const admin = await this.adminRepo.findOne({ where: { id } });
        if (!admin) throw new NotFoundException('Admin topilmadi');
        if (admin.isSuper) throw new ForbiddenException("Super adminni o'chirib bo'lmaydi");
        await this.adminRepo.remove(admin);
    }

    // ===== Joriy admin profili =====

    async setPhone(login: string, phone: string): Promise<void> {
        await this.adminRepo.update({ login }, { phone: (phone ?? '').trim() });
    }

    async updateName(login: string, name: string): Promise<void> {
        await this.adminRepo.update({ login }, { name: (name ?? '').trim() });
    }

    async setAvatar(login: string, url: string): Promise<void> {
        await this.adminRepo.update({ login }, { avatar: url });
    }

    async removeAvatar(login: string): Promise<void> {
        await this.adminRepo.update({ login }, { avatar: null });
    }

    /**
     * Joriy adminning login/parol/telefonini yangilaydi.
     * Login o'zgargan bo'lsa, bandligini tekshiradi. Yangi login'ni qaytaradi.
     */
    async applyProfileUpdate(
        login: string,
        patch: { newLogin: string; phone: string; newPassword?: string },
    ): Promise<string> {
        const admin = await this.findByLogin(login);
        if (!admin) throw new NotFoundException('Admin topilmadi');

        const update: Partial<Admin> = { phone: patch.phone.trim() };

        const newLogin = patch.newLogin.trim();
        if (newLogin && newLogin !== admin.login) {
            if (await this.findByLogin(newLogin)) {
                throw new BadRequestException('login_taken');
            }
            update.login = newLogin;
        }
        if (patch.newPassword) {
            update.passwordHash = bcrypt.hashSync(patch.newPassword, BCRYPT_ROUNDS);
        }

        await this.adminRepo.update({ id: admin.id }, update);
        return update.login ?? admin.login;
    }

    // ===== Ichki: jadvallar va seed =====

    private async ensureTables(): Promise<void> {
        try {
            await this.dataSource.query(
                'CREATE TABLE IF NOT EXISTS "app_settings" ' +
                '("key" varchar PRIMARY KEY, "value" text NOT NULL DEFAULT \'\')',
            );
            await this.dataSource.query(
                'CREATE TABLE IF NOT EXISTS "admins" (' +
                '"id" SERIAL PRIMARY KEY, ' +
                '"login" varchar NOT NULL, ' +
                '"passwordHash" varchar NOT NULL, ' +
                '"name" varchar NOT NULL DEFAULT \'\', ' +
                '"phone" varchar NOT NULL DEFAULT \'\', ' +
                '"avatar" varchar, ' +
                '"isSuper" boolean NOT NULL DEFAULT false, ' +
                '"createdAt" TIMESTAMP NOT NULL DEFAULT now())',
            );
            await this.dataSource.query(
                'CREATE UNIQUE INDEX IF NOT EXISTS "IDX_admins_login" ON "admins" ("login")',
            );
        } catch (err) {
            this.logger.warn(`Jadvallarni tayyorlab bo'lmadi: ${(err as Error).message}`);
        }
    }

    /**
     * Adminlar jadvali bo'sh bo'lsa, super adminni yaratadi.
     * Avvalgi bitta-admin tizimining app_settings qiymatlaridan (yoki env'dan) ko'chiriladi.
     */
    private async seedSuperAdmin(): Promise<void> {
        try {
            if ((await this.count()) > 0) return;

            const rows = await this.settingsRepo.find();
            const s = new Map(rows.map((r) => [r.key, r.value]));

            const login = s.get('admin_login') || this.config.get<string>('ADMIN_LOGIN', 'admin');
            const name = s.get('admin_name') || this.config.get<string>('ADMIN_NAME', 'Administrator');
            const phone = s.get('admin_phone') ?? this.config.get<string>('ADMIN_PHONE', '');
            const avatar = s.get('admin_avatar') || this.config.get<string>('ADMIN_AVATAR', '') || null;

            let passwordHash = s.get('admin_password_hash');
            if (!passwordHash) {
                const raw = this.config.get<string>('ADMIN_PASSWORD', DEFAULT_PASSWORD);
                passwordHash = raw.startsWith(BCRYPT_PREFIX)
                    ? raw
                    : bcrypt.hashSync(raw, BCRYPT_ROUNDS);
            }

            await this.adminRepo.save(
                this.adminRepo.create({
                    login,
                    passwordHash,
                    name,
                    phone: phone ?? '',
                    avatar,
                    isSuper: true,
                }),
            );
            this.logger.log(`Super admin yaratildi: ${login}`);
        } catch (err) {
            this.logger.warn(`Super adminni yaratib bo'lmadi: ${(err as Error).message}`);
        }
    }
}
