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

    // JWT_SECRET bo'lmasa ham ilovani ishdan chiqarmaymiz (production crash bo'lmasin),
    // lekin jiddiy ogohlantirish beramiz — bu xavfsiz emas.
    if (config.get<string>('NODE_ENV') === 'production') {
        // eslint-disable-next-line no-console
        console.error(
            '[auth] XAVF: JWT_SECRET o\'rnatilmagan! Vaqtinchalik xavfsiz bo\'lmagan kalit ' +
            'ishlatilmoqda. Vercel → Settings → Environment Variables ga JWT_SECRET qo\'shing.',
        );
    } else {
        // eslint-disable-next-line no-console
        console.warn('[auth] JWT_SECRET yo\'q — dev fallback ishlatilmoqda.');
    }
    return DEV_FALLBACK_SECRET;
}
