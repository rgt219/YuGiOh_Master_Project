/** Small pure helpers shared by every market page. No React in here, so they are easy to test. */

/** 12.5 -> "$12.50". Missing, zero or invalid prices mean "no listing", so they show "N/A" instead of "$0.00". */
export const formatPrice = (value) => (Number.isFinite(value) && value > 0 ? `$${value.toFixed(2)}` : 'N/A');

/** Chart axis labels: whole dollars for big prices, cents for cheap cards so "$0.35" never collapses to "$0". */
export const formatAxisPrice = (value) => (value >= 100 ? `$${Math.round(value)}` : `$${Number(value).toFixed(2)}`);

/** 3.24 -> "▲ 3.2%", -1 -> "▼ 1.0%", 0 -> "■ 0.0%". */
export const formatChange = (percent) => {
    if (!Number.isFinite(percent)) return '';
    const arrow = percent > 0 ? '▲' : percent < 0 ? '▼' : '■';
    return `${arrow} ${Math.abs(percent).toFixed(1)}%`;
};

/** Which colour family a rarity belongs to. The page turns this into a CSS class (tone_starlight, tone_secret, ...). */
export const rarityTone = (rarity) => {
    const text = String(rarity || '').toLowerCase();
    if (text.includes('starlight')) return 'starlight';
    if (text.includes('secret')) return 'secret'; // also catches "Prismatic Secret Rare" and "Quarter Century Secret Rare"
    if (text.includes('ultimate')) return 'ultimate';
    if (text.includes('ultra')) return 'ultra';
    if (text.includes('super')) return 'super';
    if (text.includes('rare')) return 'rare';
    if (text.includes('common')) return 'common';
    return 'other';
};

/**
 * Best-effort guess that a listing is a sealed product (box, pack, case) rather than a single card.
 * It only matches strong phrases. Words like "tin" or "pack" alone are NOT used, because real cards
 * are called "Tin Goldfish" and "Wolf Pack". The proper fix is a productType field from the API.
 */
export const isSealedProduct = (name) => /\b(booster (box|pack|case)|display box|sealed)\b/i.test(String(name || ''));

/** decodeURIComponent throws on a malformed "%"; a bad link should show a page, not crash it. */
export const safeDecode = (value) => {
    try {
        return decodeURIComponent(value);
    } catch {
        return value;
    }
};

/** "?page=3" -> 3. Anything missing, non-numeric or below 1 becomes 1. */
export const parsePageNumber = (value) => {
    const parsed = Number.parseInt(value ?? '1', 10);
    return Number.isInteger(parsed) && parsed >= 1 ? parsed : 1;
};

export const TCG_IMAGE = (productId, size = '200w') => `https://tcgplayer-cdn.tcgplayer.com/product/${productId}_${size}.jpg`;

/* ------------------------------------------------------------------ generated covers (used when a set has no picture) */

/** A small stable number from text. The same set name always gives the same number, so its cover never changes between visits. */
export const hashString = (text) => {
    let hash = 0;
    const value = String(text || '');
    for (let index = 0; index < value.length; index += 1) hash = (hash * 31 + value.charCodeAt(index)) >>> 0;
    return hash;
};

const SKIPPED_WORDS = new Set(['of', 'the', 'a', 'an', 'and']);

/** "Yu-Gi-Oh! Championship Series" -> "YGO", "Legendary Collection Kaiba" -> "LCK". At most three characters. */
export const setInitials = (name) => {
    const words = String(name || '')
        .replace(/[^\p{L}\p{N}\s]/gu, ' ')
        .split(/\s+/)
        .filter((word) => word && !SKIPPED_WORDS.has(word.toLowerCase()));
    const letters = words.slice(0, 3).map((word) => word[0].toUpperCase()).join('');
    return letters || '?';
};

/** Three matching colours for a generated cover, picked from the set name. */
export const coverColors = (name) => {
    const hue = hashString(name) % 360;
    return {
        from: `hsl(${hue} 60% 26%)`,
        to: `hsl(${(hue + 40) % 360} 65% 12%)`,
        accent: `hsl(${hue} 90% 68%)`,
    };
};

/** Makes an image address safe to put inside CSS url("..."). */
export const cssUrl = (address) => `url("${String(address || '').replace(/["\\\n]/g, encodeURIComponent)}")`;
