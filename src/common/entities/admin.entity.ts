import {
    Entity,
    PrimaryGeneratedColumn,
    Column,
    CreateDateColumn,
    Index,
} from 'typeorm';

/**
 * Admin hisobi. Birinchi (seed qilingan) admin — super admin (isSuper=true):
 * faqat u yangi admin qo'sha/o'chira oladi va limitni belgilaydi.
 */
@Entity('admins')
export class Admin {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ type: 'varchar' })
    login: string;

    @Column({ type: 'varchar' })
    passwordHash: string;

    @Column({ type: 'varchar', default: '' })
    name: string;

    @Column({ type: 'varchar', default: '' })
    phone: string;

    @Column({ type: 'varchar', nullable: true })
    avatar: string | null;

    @Column({ type: 'boolean', default: false })
    isSuper: boolean;

    @CreateDateColumn()
    createdAt: Date;
}
