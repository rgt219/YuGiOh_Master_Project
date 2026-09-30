// Everything that talks to YGOPRODeck lives here, so components and hooks stay small.

export const IMAGE_BASE = 'https://cards.erregeteygo.com/card-images';
const YGO_API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const EXTRA_FRAMES = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];

const buildGenesysMap = (json) => {
    const map = {};
    (json?.data || []).forEach((card) => {
        map[card.id] = card.misc_info?.[0]?.genesys_points ?? 0;
    });
    return map;
};

/** Adds the fields the deck builder needs to a raw YGOPRODeck card. */
export const normalizeCard = (card, genesysMap = {}) => {
    const type = (card.type || '').toLowerCase();
    const isLinkOrPendulum = type.includes('link') || type.includes('pendulum');

    return {
        ...card,
        isExtraDeck: EXTRA_FRAMES.includes(card.frameType?.toLowerCase()),
        isLinkOrPendulum,
        genesysPoints: isLinkOrPendulum ? 'N/A' : genesysMap[card.id] ?? 0,
        image: `${IMAGE_BASE}/${card.id}.jpg`,
        fallbackImage: card.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`,
    };
};

/** Fetches the whole card database once. Lowercase copies of name/text are prepared here so searching stays fast. */
export const fetchYgoCards = async () => {
    const [standardResponse, genesysResponse] = await Promise.all([
        fetch(`${YGO_API}?misc=yes`),
        fetch(`${YGO_API}?misc=yes&format=genesys`).catch(() => null),
    ]);

    if (!standardResponse.ok) throw new Error('Could not load the card database.');
    const standard = await standardResponse.json();
    const genesysMap = genesysResponse && genesysResponse.ok ? buildGenesysMap(await genesysResponse.json()) : {};

    return (standard.data || []).map((card) => ({
        ...normalizeCard(card, genesysMap),
        nameLower: (card.name || '').toLowerCase(),
        descLower: (card.desc || '').toLowerCase(),
    }));
};

/** Looks up specific cards (used when importing a .ydk). Returns an object keyed by card ID string. */
export const fetchCardsByIds = async (ids) => {
    const list = ids.join(',');
    const [standardResponse, genesysResponse] = await Promise.all([
        fetch(`${YGO_API}?id=${list}&misc=yes`),
        fetch(`${YGO_API}?id=${list}&misc=yes&format=genesys`).catch(() => null),
    ]);

    const standard = await standardResponse.json();
    const genesysMap = genesysResponse && genesysResponse.ok ? buildGenesysMap(await genesysResponse.json()) : {};

    const byId = {};
    (standard?.data || []).forEach((card) => {
        byId[String(card.id)] = normalizeCard(card, genesysMap);
    });
    return byId;
};

/** Thumbnail for a card in any shape. */
export const getCardImage = (card) => {
    if (!card || typeof card !== 'object') return `${IMAGE_BASE}/${card}.jpg`;
    return card.image || card.card_images?.[0]?.image_url_small || `${IMAGE_BASE}/${card.id ?? card.Id}.jpg`;
};

export const getFallbackImage = (card) => {
    if (card && typeof card === 'object' && card.fallbackImage) return card.fallbackImage;
    const id = card && typeof card === 'object' ? card.id ?? card.Id : card;
    return `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`;
};

/** Drops the search-only fields before a card is stored in Redux. */
export const toDeckCard = (card) => {
    // eslint-disable-next-line no-unused-vars
    const { nameLower, descLower, ...rest } = card;
    return rest;
};
