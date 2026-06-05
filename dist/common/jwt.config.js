"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resolveJwtSecret = resolveJwtSecret;
const DEV_FALLBACK_SECRET = 'dev-insecure-secret-change-me';
function resolveJwtSecret(config) {
    const secret = config.get('JWT_SECRET');
    if (secret && secret.trim())
        return secret.trim();
    if (config.get('NODE_ENV') === 'production') {
        throw new Error('JWT_SECRET muhit o\'zgaruvchisi production uchun MAJBURIY. ' +
            'Vercel → Settings → Environment Variables ga uzun, tasodifiy qiymat qo\'shing.');
    }
    console.warn('[auth] JWT_SECRET yo\'q — dev fallback ishlatilmoqda.');
    return DEV_FALLBACK_SECRET;
}
//# sourceMappingURL=jwt.config.js.map