"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
var AdminsService_1;
Object.defineProperty(exports, "__esModule", { value: true });
exports.AdminsService = void 0;
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const typeorm_1 = require("@nestjs/typeorm");
const typeorm_2 = require("typeorm");
const bcrypt = __importStar(require("bcryptjs"));
const admin_entity_1 = require("../common/entities/admin.entity");
const app_setting_entity_1 = require("../common/entities/app-setting.entity");
const BCRYPT_ROUNDS = 10;
const BCRYPT_PREFIX = '$2';
const DEFAULT_PASSWORD = '12345678';
const KEY_MAX_ADMINS = 'max_admins';
const DEFAULT_MAX_ADMINS = 3;
let AdminsService = AdminsService_1 = class AdminsService {
    adminRepo;
    settingsRepo;
    dataSource;
    config;
    logger = new common_1.Logger(AdminsService_1.name);
    constructor(adminRepo, settingsRepo, dataSource, config) {
        this.adminRepo = adminRepo;
        this.settingsRepo = settingsRepo;
        this.dataSource = dataSource;
        this.config = config;
    }
    async onModuleInit() {
        await this.ensureTables();
        await this.seedSuperAdmin();
    }
    static toPublic(a) {
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
    findByLogin(login) {
        return this.adminRepo.findOne({ where: { login: (login ?? '').trim() } });
    }
    async validateCredentials(login, password) {
        const admin = await this.findByLogin(login);
        if (!admin)
            return null;
        return bcrypt.compareSync(password ?? '', admin.passwordHash) ? admin : null;
    }
    list() {
        return this.adminRepo.find({ order: { isSuper: 'DESC', createdAt: 'ASC' } });
    }
    count() {
        return this.adminRepo.count();
    }
    async superAdminLacksPhone() {
        const sup = await this.adminRepo.findOne({ where: { isSuper: true } });
        return !sup?.phone;
    }
    async getMaxAdmins() {
        const row = await this.settingsRepo.findOne({ where: { key: KEY_MAX_ADMINS } });
        const v = Number(row?.value);
        return Number.isFinite(v) && v >= 1 ? v : DEFAULT_MAX_ADMINS;
    }
    async setMaxAdmins(n) {
        const val = Math.floor(n);
        if (!Number.isFinite(val) || val < 1) {
            throw new common_1.BadRequestException("Limit kamida 1 bo'lishi kerak");
        }
        const current = await this.count();
        if (val < current) {
            throw new common_1.BadRequestException(`Limit hozirgi adminlar sonidan (${current}) kam bo'lmasligi kerak`);
        }
        await this.settingsRepo.upsert({ key: KEY_MAX_ADMINS, value: String(val) }, ['key']);
    }
    async createAdmin(input) {
        const login = (input.login ?? '').trim();
        const phone = (input.phone ?? '').trim();
        const name = (input.name ?? '').trim() || login;
        if (login.length < 3)
            throw new common_1.BadRequestException("Login kamida 3 ta belgi bo'lishi kerak");
        if ((input.password ?? '').length < 6)
            throw new common_1.BadRequestException("Parol kamida 6 ta belgi bo'lishi kerak");
        if (!phone)
            throw new common_1.BadRequestException('Telefon raqam majburiy');
        if (await this.findByLogin(login)) {
            throw new common_1.BadRequestException('Bu login allaqachon band');
        }
        const max = await this.getMaxAdmins();
        const count = await this.count();
        if (count >= max) {
            throw new common_1.BadRequestException(`Admin limiti to'ldi (maksimal: ${max})`);
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
    async deleteAdmin(id) {
        const admin = await this.adminRepo.findOne({ where: { id } });
        if (!admin)
            throw new common_1.NotFoundException('Admin topilmadi');
        if (admin.isSuper)
            throw new common_1.ForbiddenException("Super adminni o'chirib bo'lmaydi");
        await this.adminRepo.remove(admin);
    }
    async setPhone(login, phone) {
        await this.adminRepo.update({ login }, { phone: (phone ?? '').trim() });
    }
    async updateName(login, name) {
        await this.adminRepo.update({ login }, { name: (name ?? '').trim() });
    }
    async setAvatar(login, url) {
        await this.adminRepo.update({ login }, { avatar: url });
    }
    async removeAvatar(login) {
        await this.adminRepo.update({ login }, { avatar: null });
    }
    async applyProfileUpdate(login, patch) {
        const admin = await this.findByLogin(login);
        if (!admin)
            throw new common_1.NotFoundException('Admin topilmadi');
        const update = { phone: patch.phone.trim() };
        const newLogin = patch.newLogin.trim();
        if (newLogin && newLogin !== admin.login) {
            if (await this.findByLogin(newLogin)) {
                throw new common_1.BadRequestException('login_taken');
            }
            update.login = newLogin;
        }
        if (patch.newPassword) {
            update.passwordHash = bcrypt.hashSync(patch.newPassword, BCRYPT_ROUNDS);
        }
        await this.adminRepo.update({ id: admin.id }, update);
        return update.login ?? admin.login;
    }
    async ensureTables() {
        try {
            await this.dataSource.query('CREATE TABLE IF NOT EXISTS "app_settings" ' +
                '("key" varchar PRIMARY KEY, "value" text NOT NULL DEFAULT \'\')');
            await this.dataSource.query('CREATE TABLE IF NOT EXISTS "admins" (' +
                '"id" SERIAL PRIMARY KEY, ' +
                '"login" varchar NOT NULL, ' +
                '"passwordHash" varchar NOT NULL, ' +
                '"name" varchar NOT NULL DEFAULT \'\', ' +
                '"phone" varchar NOT NULL DEFAULT \'\', ' +
                '"avatar" varchar, ' +
                '"isSuper" boolean NOT NULL DEFAULT false, ' +
                '"createdAt" TIMESTAMP NOT NULL DEFAULT now())');
            await this.dataSource.query('CREATE UNIQUE INDEX IF NOT EXISTS "IDX_admins_login" ON "admins" ("login")');
        }
        catch (err) {
            this.logger.warn(`Jadvallarni tayyorlab bo'lmadi: ${err.message}`);
        }
    }
    async seedSuperAdmin() {
        try {
            if ((await this.count()) > 0)
                return;
            const rows = await this.settingsRepo.find();
            const s = new Map(rows.map((r) => [r.key, r.value]));
            const login = s.get('admin_login') || this.config.get('ADMIN_LOGIN', 'admin');
            const name = s.get('admin_name') || this.config.get('ADMIN_NAME', 'Administrator');
            const phone = s.get('admin_phone') ?? this.config.get('ADMIN_PHONE', '');
            const avatar = s.get('admin_avatar') || this.config.get('ADMIN_AVATAR', '') || null;
            let passwordHash = s.get('admin_password_hash');
            if (!passwordHash) {
                const raw = this.config.get('ADMIN_PASSWORD', DEFAULT_PASSWORD);
                passwordHash = raw.startsWith(BCRYPT_PREFIX)
                    ? raw
                    : bcrypt.hashSync(raw, BCRYPT_ROUNDS);
            }
            await this.adminRepo.save(this.adminRepo.create({
                login,
                passwordHash,
                name,
                phone: phone ?? '',
                avatar,
                isSuper: true,
            }));
            this.logger.log(`Super admin yaratildi: ${login}`);
        }
        catch (err) {
            this.logger.warn(`Super adminni yaratib bo'lmadi: ${err.message}`);
        }
    }
};
exports.AdminsService = AdminsService;
exports.AdminsService = AdminsService = AdminsService_1 = __decorate([
    (0, common_1.Injectable)(),
    __param(0, (0, typeorm_1.InjectRepository)(admin_entity_1.Admin)),
    __param(1, (0, typeorm_1.InjectRepository)(app_setting_entity_1.AppSetting)),
    __metadata("design:paramtypes", [typeorm_2.Repository,
        typeorm_2.Repository,
        typeorm_2.DataSource,
        config_1.ConfigService])
], AdminsService);
//# sourceMappingURL=admins.service.js.map