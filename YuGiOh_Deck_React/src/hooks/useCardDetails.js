import { useQuery } from '@tanstack/react-query';
import { AZURE_BLOB_CONTAINER_URL } from '@/constants/cardSearchConstants';

const YGO_API = 'https://db.ygoprodeck.com/api/v7';
const DAY = 24 * 60 * 60 * 1000;
const CHUNK = 50; // ids per request, so the address stays short

const toPrice = (value) => {
    const n = parseFloat(value);
    return Number.isFinite(n) && n > 0 ? n : null;
};

// Every card we have ever downloaded, by id. Adding or removing one card from the collection
// then only downloads what is new, instead of everything again.
const cache = new Map();

const remember = (card) => cache.set(String(card.id), {
    id: card.id,
    name: card.name,
    type: card.type || '',
    image: `${AZURE_BLOB_CONTAINER_URL}/${card.id}.jpg`,
    fallbackImage: card.card_images?.[0]?.image_url || '',
    price: toPrice(card.card_prices?.[0]?.tcgplayer_price),
    sets: [...new Set((card.card_sets || []).map((s) => s.set_name))], // used by the binder to list the sets you own cards from
});

async function loadCards(ids, signal) {
    const missing = ids.filter((id) => !cache.has(id));

    for (let i = 0; i < missing.length; i += CHUNK) {
        const chunk = missing.slice(i, i + CHUNK);
        const res = await fetch(`${YGO_API}/cardinfo.php?id=${chunk.join(',')}&misc=yes`, { signal });
        if (res.status === 400 || res.status === 404) continue; // none of these ids exist
        if (!res.ok) throw new Error(`Card lookup failed (HTTP ${res.status})`);
        const json = await res.json();
        (json.data || []).forEach(remember);
    }

    const result = {};
    ids.forEach((id) => { if (cache.has(id)) result[id] = cache.get(id); });
    return result;
}

/** ids: array of card id strings. Returns { cardsById, isLoading, hasError }. */
export function useCardDetails(ids) {
    const key = [...ids].sort().join(',');
    const query = useQuery({
        queryKey: ['collectionCards', key],
        queryFn: ({ signal }) => loadCards(ids, signal),
        enabled: ids.length > 0,
        staleTime: DAY,
        gcTime: DAY,
        retry: 1,
        refetchOnWindowFocus: false,
        placeholderData: (previous) => previous, // keep showing the old cards while new ones load
    });

    return {
        cardsById: query.data ?? {},
        isLoading: ids.length > 0 && query.isPending,
        hasError: query.isError,
    };
}