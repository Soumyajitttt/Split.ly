// Parses simple duration strings like "15m", "7d", "1h", "30s", or a plain
// number (treated as milliseconds). Mirrors the subset of formats
// jsonwebtoken accepts for `expiresIn`, since ACCESS_TOKEN_EXPIRY /
// REFRESH_TOKEN_EXPIRY are reused here to size a cookie's maxAge.
const UNITS = { ms: 1, s: 1000, m: 60 * 1000, h: 60 * 60 * 1000, d: 24 * 60 * 60 * 1000 };

export function parseDurationMs(value, fallbackMs) {
    if (value == null) return fallbackMs;
    if (typeof value === 'number') return value;

    const match = String(value).trim().match(/^(\d+)\s*(ms|s|m|h|d)?$/i);
    if (!match) return fallbackMs;

    const amount = Number(match[1]);
    const unit = (match[2] || 'ms').toLowerCase();
    return amount * (UNITS[unit] || 1);
}