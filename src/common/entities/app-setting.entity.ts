import { Entity, PrimaryColumn, Column } from 'typeorm';

/**
 * Oddiy key-value sozlamalar jadvali.
 * Admin profil o'zgarishlari (login, parol-hash, ism, avatar) shu yerda saqlanadi —
 * vaqtinchalik fayl tizimi (.env) o'rniga, restart/deploy'dan keyin ham saqlanib qoladi.
 */
@Entity('app_settings')
export class AppSetting {
    @PrimaryColumn({ type: 'varchar' })
    key: string;

    @Column({ type: 'text', default: '' })
    value: string;
}
