import {
    Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, Index,
} from 'typeorm';

/**
 * Mahsulot kodi — stikerda chop etiladi, foydalanuvchi bot orqali ishlatadi.
 * Format: mahsulot prefiksi + tire + 5 belgi (katta harf/raqam). Masalan: P1-A3F7K
 */
@Entity('codes')
export class Code {
    @PrimaryGeneratedColumn()
    id: number;

    @Index({ unique: true })
    @Column({ type: 'varchar' })
    code: string;

    @Index()
    @Column({ type: 'int' })
    productId: number;

    // Kod ishlatilganda beriladigan ball (yaratishda mahsulot bonusidan olinadi)
    @Column({ type: 'int', default: 0 })
    points: number;

    @Index()
    @Column({ type: 'boolean', default: false })
    isUsed: boolean;

    @Column({ type: 'int', nullable: true })
    usedByUserId: number | null;

    @Column({ type: 'timestamptz', nullable: true })
    usedAt: Date | null;

    // Amal qilish muddati
    @Column({ type: 'timestamptz' })
    expiresAt: Date;

    @CreateDateColumn()
    createdAt: Date;
}
