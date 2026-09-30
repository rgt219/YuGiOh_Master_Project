import { useQuery } from '@tanstack/react-query';

const MARKET_API = process.env.NEXT_PUBLIC_MARKET_API_URL;
const MINUTE = 60 * 1000;
const DAY_MS = 24 * 60 * MINUTE;

/** fetch + JSON, but a bad HTTP status becomes a real error (plain fetch only throws on network failure). */
async function getJson(path, signal) {
    const res = await fetch(`${MARKET_API}${path}`, { signal });
    if (!res.ok) throw new Error(`Market API request failed (HTTP ${res.status})`);
    return res.json();
}

const toNumber = (value) => {
    if (value === null || value === undefined || value === '') return null; // Number(null) is 0, which would turn "no price" into "free"
    const n = Number(value);
    return Number.isFinite(n) ? n : null;
};

/* ------------------------------------------------------------------ sets list */

const normalizeSet = (raw) => ({
    setName: raw.setName ?? raw.SetName ?? '',
    imageUrl: raw.imageUrl ?? raw.ImageUrl ?? '',
});

export const marketSetsQuery = (page, limit) => ({
    queryKey: ['marketSets', page, limit],
    queryFn: async ({ signal }) => {
        const data = await getJson(`/api/market/sets?page=${page}&limit=${limit}`, signal);
        return (Array.isArray(data) ? data : []).map(normalizeSet).filter((set) => set.setName);
    },
    staleTime: 10 * MINUTE,
    gcTime: 30 * MINUTE,
    retry: 1,
    refetchOnWindowFocus: false,
});

/** One page of sets. The previous page stays on screen (dimmed) while the next one loads. */
export function useMarketSets(page, limit) {
    return useQuery({ ...marketSetsQuery(page, limit), placeholderData: (previous) => previous });
}

/* ------------------------------------------------------------------ cards in a set */

/** The API has sent both "productId" and "ProductId". Every spelling is handled here, once, so pages never care. */
const normalizeListing = (raw) => ({
    productId: raw.productId ?? raw.ProductId ?? null,
    cardName: raw.cardName ?? raw.CardName ?? 'Unknown Card',
    rarity: raw.rarity ?? raw.Rarity ?? 'Common',
    marketPrice: toNumber(raw.marketPrice ?? raw.MarketPrice),
});

export const setCardsQuery = (setName) => ({
    queryKey: ['setCards', setName],
    queryFn: async ({ signal }) => {
        const data = await getJson(`/api/market/sets/${encodeURIComponent(setName)}/cards`, signal);
        return (Array.isArray(data) ? data : []).map(normalizeListing);
    },
    staleTime: 5 * MINUTE,
    gcTime: 30 * MINUTE,
    retry: 1,
    refetchOnWindowFocus: false,
});

export function useSetCards(setName) {
    return useQuery(setCardsQuery(setName));
}

/* ------------------------------------------------------------------ price history */

export const normalizeHistory = (data) =>
    (Array.isArray(data) ? data : [])
        .map((item) => {
            const time = Date.parse(item.timestamp);
            return {
                ...item,
                time,
                marketPrice: toNumber(item.marketPrice),
                listedMedian: toNumber(item.listedMedian),
                displayDate: new Date(time).toLocaleDateString('en-US', { month: 'numeric', day: 'numeric' }),
            };
        })
        .filter((point) => Number.isFinite(point.time))
        .sort((a, b) => a.time - b.time); // oldest first, so "the last point" really is the latest price

/** Always asks for 30 days; the 7D / 14D buttons just slice this list, so switching range costs no request. */
export const priceHistoryQuery = (productId) => ({
    queryKey: ['priceHistory', String(productId)],
    queryFn: async ({ signal }) => normalizeHistory(await getJson(`/api/market/${productId}/history?days=30`, signal)),
    staleTime: 10 * MINUTE,
    gcTime: 30 * MINUTE,
    retry: 1,
    refetchOnWindowFocus: false,
});

export function usePriceHistory(productId) {
    return useQuery({ ...priceHistoryQuery(productId), enabled: Boolean(productId) });
}

/** Start the history download early (for example when the pointer enters a card tile) so the next page already has it. */
export function prefetchPriceHistory(queryClient, productId) {
    if (productId) queryClient.prefetchQuery(priceHistoryQuery(productId));
}

/** Keep only the points from the last `days` days, counted back from the newest point. */
export function lastDays(history, days) {
    if (!history.length) return history;
    const cutoff = history[history.length - 1].time - days * DAY_MS;
    return history.filter((point) => point.time >= cutoff);
}
