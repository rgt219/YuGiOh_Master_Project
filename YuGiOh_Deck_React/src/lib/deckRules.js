// Pure deck-building rules. No React, no network: easy to unit test and reuse.

export const LIMITS = Object.freeze({
    mainMin: 40,
    mainMax: 60,
    extraMax: 15,
    sideMax: 15,
    copies: 3,
});

const EXTRA_KEYWORDS = ['fusion', 'synchro', 'xyz', 'link'];

const isObject = (card) => card !== null && typeof card === 'object';
const typeOf = (card) => (isObject(card) ? String(card.type || card.Type || '') : '').toLowerCase();
const frameOf = (card) => (isObject(card) ? String(card.frameType || card.FrameType || '') : '').toLowerCase();

/** Cards arrive in several shapes (API, database, C# PascalCase). This is the one place that reads the ID. */
export const getCardId = (card) => {
    if (card === null || card === undefined) return '';
    if (!isObject(card)) return String(card);
    return String(card.id ?? card.Id ?? '');
};

export const getCardName = (card) => {
    const name = isObject(card) ? card.name || card.Name : '';
    return name || `Card #${getCardId(card)}`;
};

export const getCardCategory = (card) => {
    const type = typeOf(card);
    const frame = frameOf(card);
    if (type.includes('spell') || frame === 'spell') return 'spell';
    if (type.includes('trap') || frame === 'trap') return 'trap';
    return 'monster';
};

const CATEGORY_ORDER = { monster: 1, spell: 2, trap: 3 };

export const sortDeckCards = (list = []) =>
    [...list].sort((a, b) => {
        const diff = CATEGORY_ORDER[getCardCategory(a)] - CATEGORY_ORDER[getCardCategory(b)];
        return diff !== 0 ? diff : getCardName(a).localeCompare(getCardName(b));
    });

export const isExtraDeckCard = (card) => {
    const type = typeOf(card);
    if (type) return EXTRA_KEYWORDS.some((keyword) => type.includes(keyword));
    return isObject(card) && card.isExtraDeck === true;
};

/** Which section a card lands in. Mirrors the rule inside deckSlice's addCardToDeck. */
export const getDestination = (card, isSideDeck = false) => {
    if (isSideDeck) return 'side';
    return isExtraDeckCard(card) ? 'extra' : 'main';
};

/** Map of cardId -> copies across any number of card lists. */
export const buildCopyMap = (...lists) => {
    const map = new Map();
    lists.forEach((list) =>
        (list || []).forEach((card) => {
            const id = getCardId(card);
            map.set(id, (map.get(id) || 0) + 1);
        })
    );
    return map;
};

const FULL_MESSAGES = {
    main: `The main deck is full (${LIMITS.mainMax} cards).`,
    extra: `The extra deck is full (${LIMITS.extraMax} cards).`,
    side: `The side deck is full (${LIMITS.sideMax} cards).`,
};

/** Decide whether a card can be added *before* dispatching, so the user always gets a reason. */
export const canAddCard = ({ card, isSideDeck = false, main = [], extra = [], side = [] }) => {
    const id = getCardId(card);
    if (!id) return { ok: false, reason: 'That card could not be added.' };

    const copies = buildCopyMap(main, extra, side).get(id) || 0;
    if (copies >= LIMITS.copies) {
        return { ok: false, reason: `You already have ${LIMITS.copies} copies of "${getCardName(card)}".` };
    }

    const destination = getDestination(card, isSideDeck);
    const sizes = { main: main.length, extra: extra.length, side: side.length };
    const maximums = { main: LIMITS.mainMax, extra: LIMITS.extraMax, side: LIMITS.sideMax };
    if (sizes[destination] >= maximums[destination]) {
        return { ok: false, reason: FULL_MESSAGES[destination] };
    }

    return { ok: true, destination };
};

export const summarizeMain = (main = []) => {
    const totals = { monster: 0, spell: 0, trap: 0 };
    main.forEach((card) => { totals[getCardCategory(card)] += 1; });
    return totals;
};

const readGenesysPoints = (card) => {
    if (card.genesysPoints !== undefined && card.genesysPoints !== null) return card.genesysPoints;
    if (card.GenesysPoints !== undefined && card.GenesysPoints !== null) return card.GenesysPoints;
    if (card.genesys_points !== undefined && card.genesys_points !== null) return card.genesys_points;
    if (Array.isArray(card.misc_info) && card.misc_info[0]?.genesys_points !== undefined) {
        return card.misc_info[0].genesys_points;
    }
    return 0;
};

/** Total Genesys points, and whether the deck contains Link/Pendulum cards (not allowed in Genesys). */
export const summarizeGenesys = (cards = []) => {
    let points = 0;
    let hasIllegalCards = false;

    cards.forEach((card) => {
        if (!isObject(card)) return;
        const type = typeOf(card);
        const frame = frameOf(card);
        const banned =
            card.isLinkOrPendulum === true ||
            card.genesysPoints === 'N/A' ||
            card.GenesysPoints === 'N/A' ||
            type.includes('link') || type.includes('pendulum') ||
            frame.includes('link') || frame.includes('pendulum');

        if (banned) hasIllegalCards = true;
        else points += parseInt(readGenesysPoints(card), 10) || 0;
    });

    return { points, hasIllegalCards };
};

/** Everything wrong with the deck right now. `level` is 'error' (not legal) or 'warning' (still a draft). */
export const validateDeck = ({ main = [], extra = [], side = [] }) => {
    const issues = [];

    if (main.length < LIMITS.mainMin) {
        issues.push({ id: 'main-min', level: 'warning', text: `Main deck has ${main.length} cards. A legal deck needs at least ${LIMITS.mainMin}.` });
    }
    if (main.length > LIMITS.mainMax) {
        issues.push({ id: 'main-max', level: 'error', text: `Main deck has ${main.length} cards. The maximum is ${LIMITS.mainMax}.` });
    }
    if (extra.length > LIMITS.extraMax) {
        issues.push({ id: 'extra-max', level: 'error', text: `Extra deck has ${extra.length} cards. The maximum is ${LIMITS.extraMax}.` });
    }
    if (side.length > LIMITS.sideMax) {
        issues.push({ id: 'side-max', level: 'error', text: `Side deck has ${side.length} cards. The maximum is ${LIMITS.sideMax}.` });
    }

    const names = new Map();
    [...main, ...extra, ...side].forEach((card) => names.set(getCardId(card), getCardName(card)));
    buildCopyMap(main, extra, side).forEach((count, id) => {
        if (count > LIMITS.copies) {
            issues.push({ id: `copies-${id}`, level: 'error', text: `"${names.get(id)}" appears ${count} times. The maximum is ${LIMITS.copies}.` });
        }
    });

    return { issues, isLegal: !issues.some((issue) => issue.level === 'error') && main.length >= LIMITS.mainMin };
};
