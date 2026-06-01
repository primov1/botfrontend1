import { ConfigService } from '@nestjs/config';

/**
 * JWT maxfiy kalitini bitta joyda hal qiladi.
 * - Production'da JWT_SECRET majburiy — bo'lmasa ilova darhol, aniq xato bilan to'xtaydi.
 * - Lokal ishlab chiqishda fallback ishlatiladi (ogohlantirish bilan).
 */
const DEV_FALLBACK_SECRET = 'dev-insecure-secret-change-me';

export function resolveJwtSecret(config: ConfigService): string {
    const secret = config.get<string>('JWT_SECRET');
    if (secret && secret.trim()) return secret.trim();

    if (config.get<string>('NODE_ENV') === 'production') {
        throw new Error(
            'JWT_SECRET muhit o\'zgaruvchisi production uchun majburiy. ' +
            'Railway/Vercel → Variables ga uzun, tasodifiy qiymat qo\'shing.',
        );
    }

    // eslint-disable-next-line no-console
    console.warn(
        '[auth] JWT_SECRET o\'rnatilmagan — vaqtinchalik dev kaliti ishlatilmoqda. ' +
        'Production\'da albatta JWT_SECRET qo\'ying.',
    );
    return DEV_FALLBACK_SECRET;
}
