"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseCookies = parseCookies;
function parseCookies(header) {
    const out = {};
    if (!header)
        return out;
    const parts = header.split(';');
    for (const part of parts) {
        const idx = part.indexOf('=');
        if (idx < 0)
            continue;
        const key = part.slice(0, idx).trim();
        if (!key)
            continue;
        let value = part.slice(idx + 1).trim();
        if (value.startsWith('"') && value.endsWith('"')) {
            value = value.slice(1, -1);
        }
        try {
            out[key] = decodeURIComponent(value);
        }
        catch {
            out[key] = value;
        }
    }
    return out;
}
//# sourceMappingURL=cookie.util.js.map