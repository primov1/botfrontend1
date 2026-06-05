import { OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { DataSource, Repository } from 'typeorm';
import { Admin } from '../common/entities/admin.entity';
import { AppSetting } from '../common/entities/app-setting.entity';
export interface PublicAdmin {
    id: number;
    login: string;
    name: string;
    phone: string;
    avatar: string | null;
    isSuper: boolean;
    createdAt: Date;
}
export declare class AdminsService implements OnModuleInit {
    private readonly adminRepo;
    private readonly settingsRepo;
    private readonly dataSource;
    private readonly config;
    private readonly logger;
    constructor(adminRepo: Repository<Admin>, settingsRepo: Repository<AppSetting>, dataSource: DataSource, config: ConfigService);
    onModuleInit(): Promise<void>;
    static toPublic(a: Admin): PublicAdmin;
    findByLogin(login: string): Promise<Admin | null>;
    validateCredentials(login: string, password: string): Promise<Admin | null>;
    list(): Promise<Admin[]>;
    count(): Promise<number>;
    superAdminLacksPhone(): Promise<boolean>;
    getMaxAdmins(): Promise<number>;
    setMaxAdmins(n: number): Promise<void>;
    createAdmin(input: {
        login: string;
        password: string;
        name?: string;
        phone: string;
    }): Promise<Admin>;
    deleteAdmin(id: number): Promise<void>;
    setPhone(login: string, phone: string): Promise<void>;
    updateName(login: string, name: string): Promise<void>;
    setAvatar(login: string, url: string): Promise<void>;
    removeAvatar(login: string): Promise<void>;
    applyProfileUpdate(login: string, patch: {
        newLogin: string;
        phone: string;
        newPassword?: string;
    }): Promise<string>;
    private ensureTables;
    private seedSuperAdmin;
}
