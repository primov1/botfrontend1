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
        // Production'da JWT_SECRET bo'lmasa — to'xtatamiz (xavfsizlik talabi).
        throw new Error(
            'JWT_SECRET muhit o\'zgaruvchisi production uchun MAJBURIY. ' +
            'Vercel → Settings → Environment Variables ga uzun, tasodifiy qiymat qo\'shing.',
        );
    }
    // eslint-disable-next-line no-console
    console.warn('[auth] JWT_SECRET yo\'q — dev fallback ishlatilmoqda.');
    return DEV_FALLBACK_SECRET;
}
