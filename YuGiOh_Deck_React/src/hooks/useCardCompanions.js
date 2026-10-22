import { useQuery } from '@tanstack/react-query';
import { fetchCompanions } from '@/lib/companionApi';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL ||
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

const HOUR = 60 * 60 * 1000;
const EMPTY = { deckCount: 0, companions: [], sideCompanions: [] };

/**
 * const { data, isLoading, hasError } = useCardCompanions(card.id);
 *   data.companions      -> [{ cardId, together, percent, lift }, ...]
 *   data.sideCompanions  -> same shape
 */
export function useCardCompanions(cardId) {
    const id = cardId == null ? '' : String(cardId);

    const query = useQuery({
        queryKey: ['cardCompanions', id],                                        // blank 1
        queryFn: ({ signal }) => fetchCompanions(API_BASE_URL, id, { signal }),  // blank 2
        enabled: id !== '',                                                      // blank 3
        staleTime: HOUR,                                                           // blank 4
        retry: 1,
        refetchOnWindowFocus: false,
    });

    return {
        data: query.data ?? EMPTY,                                                  // blank 5
        isLoading: id !== '' && query.isPending,
        hasError: query.isError,
    };
}