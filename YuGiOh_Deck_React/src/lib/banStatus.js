/**
 * Ban list helpers for the card pages.
 * Your API (GET /BanList/cards) returns { masterduel: [{id, name, status}], tcg: [...], ocg: [...] }.
 */

/** [{id, name, status}] -> { [id]: status } so a card's status is one lookup, not a search through the list. */
export function indexByCardId(entries = []) {
    const byId = {};
    entries.forEach((entry) => { if (entry?.id) byId[entry.id] = entry.status; });
    return byId;
}

export function indexBanLists(data = {}) {
    return {
        masterduel: indexByCardId(data.masterduel),
        tcg: indexByCardId(data.tcg),
        ocg: indexByCardId(data.ocg),
    };
}

/**
 * Returns the card with its banlist taken from your API.
 * Master Duel: your API is the only source. TCG / OCG: your API wins, YGOPRODeck's value is the fallback.
 * Until the lists have loaded (`lists` is undefined) the card is returned unchanged.
 */
export function withBanStatus(card, lists) {
    if (!card || !lists) return card;
    return {
        ...card,
        banlist: {
            masterduel: lists.masterduel[card.id] || 'Unlimited',
            tcg: lists.tcg[card.id] || card.banlist?.tcg || 'Unlimited',
            ocg: lists.ocg[card.id] || card.banlist?.ocg || 'Unlimited',
        },
    };
}