import { useCallback, useDeferredValue, useEffect, useMemo, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { normalizeDeck, sortDecksNewestFirst } from '@/utils/metaDeckHelpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL ||
    'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

export const DECKS_PER_PAGE = 12;
export const FORMATS = ['TCG', 'OCG', 'MASTER DUEL', 'GENESYS'];

const EMPTY = [];

/** Downloads one format's decks, cleans them up once, and sorts them once. React Query caches the result. */
const fetchFormat = async (format, signal) => {
    const res = await fetch(`${API_BASE_URL}/metadecks?format=${encodeURIComponent(format)}`, { signal });
    if (!res.ok) throw new Error(`Failed to fetch ${format} tournament meta decks`);
    const data = await res.json();
    const list = Array.isArray(data) ? data : [];
    return sortDecksNewestFirst(list.map((raw) => normalizeDeck(raw, { keepCards: false })));
};

const formatQuery = (format) => ({
    queryKey: ['metaDecks', format],
    queryFn: ({ signal }) => fetchFormat(format, signal), // `signal` cancels the request if you switch tabs quickly
    staleTime: 5 * 60 * 1000,
    gcTime: 30 * 60 * 1000,
});

const readUrl = () => {
    const params = new URLSearchParams(window.location.search);
    const format = (params.get('format') || '').toUpperCase();
    return {
        format: FORMATS.includes(format) ? format : 'TCG',
        search: params.get('q') || '',
        page: Math.max(1, parseInt(params.get('page'), 10) || 1),
    };
};

/**
 * Everything the archive page needs: which format, what was typed, which page, and the decks to show.
 * Format, search and page are mirrored into the address bar (?format=OCG&q=snake&page=2), so the back
 * button from a deck profile lands you exactly where you were, and links can be shared.
 */
export function useMetaDecks() {
    const queryClient = useQueryClient();
    const [format, setFormatState] = useState('TCG');
    const [search, setSearchState] = useState('');
    const [page, setPage] = useState(1);
    const [ready, setReady] = useState(false); // becomes true once the address bar has been read

    // Read the address bar after the first render (doing it earlier would not match the server's HTML).
    useEffect(() => {
        const fromUrl = readUrl();
        setFormatState(fromUrl.format);
        setSearchState(fromUrl.search);
        setPage(fromUrl.page);
        setReady(true);
    }, []);

    // Write it back. replaceState = no new history entry per keystroke.
    useEffect(() => {
        if (!ready) return;
        const params = new URLSearchParams();
        if (format !== 'TCG') params.set('format', format);
        if (search) params.set('q', search);
        if (page > 1) params.set('page', String(page));
        const qs = params.toString();
        window.history.replaceState(null, '', qs ? `?${qs}` : window.location.pathname);
    }, [ready, format, search, page]);

    const query = useQuery({ ...formatQuery(format), enabled: ready });

    const deferredSearch = useDeferredValue(search); // typing stays snappy; the list catches up a moment later
    const term = deferredSearch.trim().toLowerCase();
    const all = query.data ?? EMPTY;

    const filtered = useMemo(
        () => (term ? all.filter((deck) => deck.searchText.includes(term)) : all),
        [all, term]
    );

    const totalPages = Math.max(1, Math.ceil(filtered.length / DECKS_PER_PAGE));
    const safePage = Math.min(page, totalPages);
    const decks = useMemo(
        () => filtered.slice((safePage - 1) * DECKS_PER_PAGE, safePage * DECKS_PER_PAGE),
        [filtered, safePage]
    );

    const setFormat = useCallback((next) => {
        setFormatState(next);
        setSearchState('');
        setPage(1);
    }, []);

    const setSearch = useCallback((value) => {
        setSearchState(value);
        setPage(1);
    }, []);

    /** Start downloading a format's decks when the visitor hovers its tab, so the click feels instant. */
    const prefetchFormat = useCallback(
        (next) => { if (next !== format) queryClient.prefetchQuery(formatQuery(next)); },
        [queryClient, format]
    );

    return {
        format, setFormat,
        search, setSearch,
        decks,
        totalCount: all.length,
        matchCount: filtered.length,
        page: safePage, setPage, totalPages,
        loading: !ready || query.isPending,
        error: query.error ? query.error.message : null,
        refetch: query.refetch,
        prefetchFormat,
    };
}
