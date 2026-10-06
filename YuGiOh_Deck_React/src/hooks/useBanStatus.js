import { useQuery } from '@tanstack/react-query';
import { indexBanLists } from '@/lib/banStatus';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL ||
    'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

/**
 * Master Duel / TCG / OCG ban lists from your API, as { masterduel: {id: status}, tcg: {...}, ocg: {...} }.
 * Downloaded once (and only once `enabled` is true, e.g. when the inspector opens), then cached.
 * Returns undefined until it has loaded, or if the download failed (callers then keep what they had).
 */
export function useBanStatus(enabled = true) {
    const query = useQuery({
        queryKey: ['banLists'],
        queryFn: async ({ signal }) => {
            const res = await fetch(`${API_BASE_URL}/BanList/cards`, { signal });
            if (!res.ok) throw new Error(`Ban lists failed (HTTP ${res.status})`);
            return indexBanLists(await res.json());
        },
        enabled,
        staleTime: 10 * 60 * 1000,
        gcTime: 60 * 60 * 1000,
        retry: 1,
        refetchOnWindowFocus: false,
    });
    return query.data;
}