import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { AZURE_BLOB_CONTAINER_URL } from '../constants/cardSearchConstants';

const YGO_API = 'https://db.ygoprodeck.com/api/v7';
const HOUR = 60 * 60 * 1000;

/** "12.5" -> 12.5, "0.00" / missing -> null. Prices of 0 mean "no listing", not "free". */
const toPrice = (value) => {
    const n = parseFloat(value);
    return Number.isFinite(n) && n > 0 ? n : null;
};
const money = (symbol, n) => (n === null ? 'N/A' : `${symbol}${n.toFixed(2)}`);

/**
 * Turns one raw YGOPRODeck card into the shape the page uses.
 * Everything the search and sort need (lowercase text, numeric price) is worked out HERE, once per download,
 * so typing in the search box or changing the sort never repeats that work for 14,000 cards.
 */
const normalizeCard = (c) => {
    const priceObj = c.card_prices?.[0] || {};
    const banObj = c.banlist_info || {};
    const type = c.type || 'Normal';
    const typeLower = type.toLowerCase();
    const isLinkOrPendulum = typeLower.includes('link') || typeLower.includes('pendulum');
    const tcg = toPrice(priceObj.tcgplayer_price);
    const name = c.name || 'Unknown Card';
    const desc = c.desc || 'No card text available.';
    const rarities = (c.card_sets || []).map((s) => `${s.set_rarity || ''} ${s.set_rarity_code || ''}`.toLowerCase()).join('|');

    return {
        id: c.id,
        name,
        type,
        desc,
        level: c.level || c.rank || c.linkval || null,
        atk: c.atk ?? null,
        def: c.def ?? null,
        race: c.race || '',
        attribute: c.attribute || '',
        image: `${AZURE_BLOB_CONTAINER_URL}/${c.id}.jpg`,
        fallbackImage: c.card_images?.[0]?.image_url || '',
        prices: {
            tcgplayer: money('$', tcg),
            cardmarket: money('€', toPrice(priceObj.cardmarket_price)),
            ebay: money('$', toPrice(priceObj.ebay_price)),
        },
        banlist: {
            masterduel: banObj.ban_masterduel || 'Unlimited',
            tcg: banObj.ban_tcg || 'Unlimited',
            ocg: banObj.ban_ocg || 'Unlimited',
        },
        isLinkOrPendulum,
        genesysPoints: isLinkOrPendulum ? 'N/A' : null, // filled in lazily by useGenesysPoints
        cardSets: c.card_sets || [],
        // ---- precomputed for searching and sorting (not shown anywhere) ----
        nameLower: name.toLowerCase(),
        typeLower,
        raceLower: (c.race || '').toLowerCase(),
        raritiesLower: rarities,
        searchText: `${name} ${desc} ${c.id}`.toLowerCase(),
        priceNum: tcg,
        levelNum: typeof (c.level || c.rank || c.linkval) === 'number' ? (c.level || c.rank || c.linkval) : null,
    };
};

// A few entries in the database are placeholders such as "???". They are not real cards.
const isRealCard = (c) => Boolean(c.name) && !/^\?+$/.test(c.name.trim());

const fetchCards = async (params, signal) => {
    const res = await fetch(`${YGO_API}/cardinfo.php?${params}`, { signal });
    if (res.status === 400 || res.status === 404) return []; // YGOPRODeck answers 400 when nothing matches
    if (!res.ok) throw new Error(`Card search failed (HTTP ${res.status})`);
    const json = await res.json();
    return (json.data || []).filter(isRealCard).map(normalizeCard);
};

const EMPTY = [];

/**
 * The cards for one combination of server-side filters. React Query caches each combination for an hour,
 * so going back to a filter you already used costs nothing, and two components asking for the same cards share one download.
 */
export function useCardSearch(filters) {
    const { selectedAttribute, selectedRace, selectedArchetype, selectedLevel, selectedLink, selectedScale } = filters;

    const params = useMemo(() => {
        const p = new URLSearchParams();
        p.append('misc', 'yes');
        if (selectedAttribute !== 'ALL') p.append('attribute', selectedAttribute.toLowerCase());
        if (selectedRace && !selectedRace.startsWith('ALL')) p.append('race', selectedRace);
        if (selectedArchetype !== 'ALL') p.append('archetype', selectedArchetype);
        if (selectedLevel !== 'ALL') p.append('level', selectedLevel);
        if (selectedLink !== 'ALL') p.append('link', selectedLink);
        if (selectedScale !== 'ALL') p.append('scale', selectedScale);
        return p.toString();
    }, [selectedAttribute, selectedRace, selectedArchetype, selectedLevel, selectedLink, selectedScale]);

    const query = useQuery({
        queryKey: ['cardSearch', params],
        queryFn: ({ signal }) => fetchCards(params, signal),
        staleTime: HOUR,
        gcTime: 24 * HOUR,
        retry: 1,
        refetchOnWindowFocus: false,
        placeholderData: (previous) => previous, // keep showing the old results while the new ones load
    });

    return {
        rawCards: query.data ?? EMPTY,
        isLoading: query.isPending,
        isFetching: query.isFetching,
        hasError: query.isError,
        fetchCards: query.refetch,
    };
}

/** Genesys points for every card, downloaded once (and only once someone opens the inspector), then cached for a day. */
export function useGenesysPoints(enabled) {
    const query = useQuery({
        queryKey: ['genesysPoints'],
        queryFn: async ({ signal }) => {
            const res = await fetch(`${YGO_API}/cardinfo.php?format=genesys&misc=yes`, { signal });
            if (!res.ok) return {};
            const json = await res.json();
            const map = {};
            (json.data || []).forEach((c) => { map[c.id] = c.misc_info?.[0]?.genesys_points ?? 0; });
            return map;
        },
        enabled,
        staleTime: 24 * HOUR,
        gcTime: 24 * HOUR,
        retry: 0,
        refetchOnWindowFocus: false,
    });
    return query.data;
}

/** The archetype list for the dropdown: one download a day. */
export function useArchetypes() {
    const query = useQuery({
        queryKey: ['archetypes'],
        queryFn: async ({ signal }) => {
            const res = await fetch(`${YGO_API}/archetypes.php`, { signal });
            if (!res.ok) return [];
            const data = await res.json();
            return data.map((a) => a.archetype_name).sort();
        },
        staleTime: 24 * HOUR,
        gcTime: 24 * HOUR,
        refetchOnWindowFocus: false,
    });
    return useMemo(() => ['ALL', ...(query.data || [])], [query.data]);
}
