import { useState, useMemo, useEffect, useCallback, useDeferredValue } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchYgoCards } from '@/lib/cardData';

export const PAGE_SIZE = 48;

export const DEFAULT_FILTERS = Object.freeze({
    mainType: 'ALL',
    attribute: 'ALL',
    ability: 'ALL',
    type: 'ALL',
    race: 'ALL RACES / TYPES',
    archetype: 'ALL',
    rarity: 'ALL',
    level: 'ALL',
    link: 'ALL',
    scale: 'ALL',
});

const RACE_DEFAULT_BY_MAIN_TYPE = {
    SPELL: 'ALL SPELL TYPES',
    TRAP: 'ALL TRAP TYPES',
    NORMAL: 'ALL MONSTER TYPES',
    EFFECT: 'ALL MONSTER TYPES',
};

const isAll = (value) => !value || value.startsWith('ALL');

const matchesFilters = (card, f) => {
    const type = card.type?.toLowerCase() || '';

    if (f.mainType === 'NORMAL' && !(type.includes('monster') && !type.includes('effect'))) return false;
    if (f.mainType === 'EFFECT' && !(type.includes('monster') && type.includes('effect'))) return false;
    if (f.mainType === 'SPELL' && !type.includes('spell')) return false;
    if (f.mainType === 'TRAP' && !type.includes('trap')) return false;

    if (f.attribute !== 'ALL' && card.attribute?.toUpperCase() !== f.attribute.toUpperCase()) return false;
    if (f.ability !== 'ALL' && !type.includes(f.ability.toLowerCase())) return false;
    if (f.type !== 'ALL' && !type.includes(f.type.toLowerCase())) return false;
    if (!isAll(f.race) && card.race?.toLowerCase() !== f.race.toLowerCase()) return false;
    if (f.archetype !== 'ALL' && card.archetype?.toLowerCase() !== f.archetype.toLowerCase()) return false;

    if (f.rarity !== 'ALL') {
        const wanted = f.rarity.toLowerCase();
        const found = card.card_sets?.some(
            (set) =>
                set.set_rarity?.toLowerCase().includes(wanted) ||
                set.set_rarity_code?.toLowerCase().includes(wanted)
        );
        if (!found) return false;
    }

    if (f.level !== 'ALL' && card.level !== parseInt(f.level, 10)) return false;
    if (f.link !== 'ALL' && card.linkval !== parseInt(f.link, 10)) return false;
    if (f.scale !== 'ALL' && card.scale !== parseInt(f.scale, 10)) return false;
    return true;
};

/** Owns the card database, the search box, the filters and paging for the deck builder's search panel. */
export function useDeckCardSearch() {
    const cardsQuery = useQuery({
        queryKey: ['ygoCards'],
        queryFn: fetchYgoCards,
        staleTime: 1000 * 60 * 60,
        gcTime: 1000 * 60 * 60 * 2,
    });
    const archetypesQuery = useQuery({
        queryKey: ['ygoArchetypes'],
        queryFn: async () => {
            const res = await fetch('https://db.ygoprodeck.com/api/v7/archetypes.php');
            if (!res.ok) throw new Error('archetypes');
            const data = await res.json();
            return data.map((a) => a.archetype_name).sort();
        },
        staleTime: 1000 * 60 * 60,
    });

    const [searchQuery, setSearchQuery] = useState('');
    const [filters, setFilters] = useState(DEFAULT_FILTERS);
    const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);

    // Typing stays instant; the heavy filtering runs on the deferred value.
    const deferredQuery = useDeferredValue(searchQuery);

    const setFilter = useCallback((key, value) => setFilters((prev) => ({ ...prev, [key]: value })), []);

    const setMainType = useCallback((mainType) => {
        setFilters((prev) => ({
            ...prev,
            mainType,
            race: RACE_DEFAULT_BY_MAIN_TYPE[mainType] || DEFAULT_FILTERS.race,
        }));
    }, []);

    const resetFilters = useCallback(() => {
        setSearchQuery('');
        setFilters(DEFAULT_FILTERS);
    }, []);

    const activeFilterCount = useMemo(() => {
        let count = 0;
        Object.entries(filters).forEach(([key, value]) => {
            if (key === 'race' ? !isAll(value) : value !== 'ALL') count += 1;
        });
        return count;
    }, [filters]);

    const hasActiveFilters = searchQuery.trim() !== '' || activeFilterCount > 0;

    const matches = useMemo(() => {
        const cards = cardsQuery.data || [];
        const query = deferredQuery.trim().toLowerCase();
        if (!query && activeFilterCount === 0) return [];

        return cards.filter((card) => {
            const textMatch = !query || card.nameLower.includes(query) || card.descLower.includes(query) || String(card.id).includes(query);
            return textMatch && matchesFilters(card, filters);
        });
    }, [cardsQuery.data, deferredQuery, filters, activeFilterCount]);

    // New search or filters: go back to the first page.
    useEffect(() => { setVisibleCount(PAGE_SIZE); }, [deferredQuery, filters]);

    const loadMore = useCallback(() => setVisibleCount((count) => count + PAGE_SIZE), []);

    return {
        isLoading: cardsQuery.isLoading,
        isError: cardsQuery.isError,
        retry: cardsQuery.refetch,
        searchQuery, setSearchQuery,
        filters, setFilter, setMainType, resetFilters,
        activeFilterCount, hasActiveFilters,
        archetypes: ['ALL', ...(archetypesQuery.data || [])],
        results: matches.slice(0, visibleCount),
        totalMatches: matches.length,
        hasMore: matches.length > visibleCount,
        loadMore,
    };
}
