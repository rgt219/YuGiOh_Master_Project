/**
 * Compares a deck with a collection.
 *
 *   cards  one entry per COPY in the deck (3 copies of Ash Blossom = 3 entries), each with an `id`
 *          and optionally `name` and `card_prices` (the same shape DeckPriceWidget reads).
 *   owned  { [cardId]: quantity }, from useCollection().
 *
 * Pure function, no React: easy to test, easy to reuse.
 */

export const priceOf = (card, provider = 'tcgplayer_price') => {
    const prices = card?.card_prices?.[0] || card?.card_prices || card?.cardPrices || {};
    const value = parseFloat(prices[provider]);
    return Number.isFinite(value) ? value : 0;
};

export function computeGap(cards = [], owned = {}) {
    // 1. Group the copies by card id.
    const byId = new Map();
    cards.forEach((card) => {
        const id = String(card?.id ?? card?.Id ?? '');
        if (!id) return;
        const entry = byId.get(id) || { id, name: card.name || card.Name || `Card #${id}`, needed: 0, unitPrice: 0 };
        entry.needed += 1;
        const price = priceOf(card);
        if (price > 0) entry.unitPrice = price; // keep the first real price we see
        byId.set(id, entry);
    });

    // 2. For each card: how many do you already have (never more than the deck needs), how many are missing?
    const rows = [...byId.values()].map((entry) => {
        const have = Math.min(owned[entry.id] || 0, entry.needed);
        const missing = entry.needed - have;
        return { ...entry, owned: have, missing, missingCost: missing * entry.unitPrice };
    });

    // Missing cards first, most expensive gap first; finished cards after, A-Z.
    rows.sort((a, b) => (b.missing > 0) - (a.missing > 0) || b.missingCost - a.missingCost || a.name.localeCompare(b.name));

    const totalCopies = rows.reduce((sum, r) => sum + r.needed, 0);
    const ownedCopies = rows.reduce((sum, r) => sum + r.owned, 0);
    const missingCopies = totalCopies - ownedCopies;
    const missingCost = rows.reduce((sum, r) => sum + r.missingCost, 0);

    return {
        rows,
        totalCopies,
        ownedCopies,
        missingCopies,
        missingCost,
        percent: totalCopies ? Math.round((ownedCopies / totalCopies) * 100) : 0,
        complete: totalCopies > 0 && missingCopies === 0,
    };
}