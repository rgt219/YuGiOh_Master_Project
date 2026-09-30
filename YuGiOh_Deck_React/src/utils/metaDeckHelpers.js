// Helpers for the meta-deck pages.
//
// Your API (and your database) sometimes spell the same field two ways: "archetype" and "Archetype",
// "pilot" and "Author", and so on. `normalizeDeck` is the ONE place that knows about that. After it runs,
// every component can simply read deck.archetype, deck.pilot, deck.placement ...

/** Picks the first of the given keys that actually has a value. */
const pick = (obj, ...keys) => {
    for (const key of keys) {
        if (obj && obj[key] !== undefined && obj[key] !== null) return obj[key];
    }
    return undefined;
};

const ID_KEYS = ['id', 'Id', 'ID', 'cardId', 'CardId', 'card_id', 'passcode', 'Passcode', 'konamiId', 'KonamiId', 'konami_id', 'ygoprodeckId', 'cid'];
const looksLikeId = (v) => (typeof v === 'number' && Number.isInteger(v) && v > 0) || (typeof v === 'string' && /^\d{3,}$/.test(v));

/**
 * A deck list entry is normally a number, but tolerate numeric strings and objects such as { id: 123 } or { card: { id: 123 } }.
 * Never returns undefined: an entry we cannot read becomes 'unknown', so the deck still shows the right number of cards
 * (as card backs) instead of silently shrinking to 0.
 */
const toCardId = (entry) => {
    if (entry === null || entry === undefined) return 'unknown';
    if (typeof entry !== 'object') return String(entry).trim() === '' ? 'unknown' : entry;
    for (const key of ID_KEYS) if (looksLikeId(entry[key])) return entry[key];
    if (entry.card && typeof entry.card === 'object') {
        for (const key of ID_KEYS) if (looksLikeId(entry.card[key])) return entry.card[key];
    }
    const anyId = Object.values(entry).find(looksLikeId); // last resort: any numeric-looking value
    return anyId !== undefined ? anyId : 'unknown';
};

/** The three cards fanned out on a deck tile (falls back to card backs). Kept from the old file. */
export const getFannedCards = (main = [], extra = [], side = []) => {
    const combined = [...main, ...extra, ...side].filter(Boolean);
    const unique = Array.from(new Set(combined));
    while (unique.length < 3) unique.push('back_high');
    return unique.slice(0, 3);
};

/**
 * Turns one raw deck from the API into one predictable shape.
 * keepCards=false is for the list page: it only needs the counts and three card IDs, so the big
 * card arrays are thrown away and the cache stays small.
 */
export const normalizeDeck = (raw, { keepCards = true } = {}) => {
    const sample = pick(raw, 'sampleDeck', 'SampleDeck') || {};
    const ids = (list) => (Array.isArray(list) ? list.map(toCardId) : []);
    const main = ids(pick(sample, 'mainDeck', 'MainDeck'));
    const extra = ids(pick(sample, 'extraDeck', 'ExtraDeck'));
    const side = ids(pick(sample, 'sideDeck', 'SideDeck'));

    const id = pick(raw, 'id', 'Id', '_id');
    const archetype = pick(raw, 'archetype', 'Archetype') || 'TOURNAMENT META DECK';
    const pilot = pick(raw, 'pilot', 'Pilot', 'author', 'Author') || '';
    const placement = pick(raw, 'placement', 'Placement') || '';
    const updated = pick(raw, 'lastUpdated', 'LastUpdated');
    const updatedAt = updated ? new Date(updated).getTime() : null;

    return {
        id: id === undefined ? '' : String(id),
        archetype,
        format: pick(raw, 'format', 'Format') || 'TCG',
        pilot,
        placement,
        updatedAt: Number.isFinite(updatedAt) ? updatedAt : null,
        counts: { main: main.length, extra: extra.length, side: side.length },
        fanned: getFannedCards(main, extra, side),
        main: keepCards ? main : [],
        extra: keepCards ? extra : [],
        side: keepCards ? side : [],
        // Lowercase text prepared once, so typing in the search box never re-does this work.
        searchText: `${archetype} ${pilot} ${placement}`.toLowerCase(),
    };
};

/**
 * Newest first. Numeric IDs compare as numbers; other IDs (for example Mongo ObjectIds, whose first
 * characters are a timestamp) compare as text. The old code turned every ObjectId into NaN, which
 * silently broke the sort. Ties fall back to the last-updated date.
 */
export const sortDecksNewestFirst = (decks) =>
    [...decks].sort((a, b) => {
        const na = Number(a.id);
        const nb = Number(b.id);
        if (Number.isFinite(na) && Number.isFinite(nb)) {
            if (na !== nb) return nb - na;
        } else if (a.id !== b.id) {
            return a.id < b.id ? 1 : -1;
        }
        return (b.updatedAt || 0) - (a.updatedAt || 0);
    });

export const formatDate = (ms) =>
    ms ? new Date(ms).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'RECENTLY';
