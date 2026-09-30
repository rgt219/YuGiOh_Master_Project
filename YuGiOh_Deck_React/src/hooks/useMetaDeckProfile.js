import { useMemo } from 'react';
import { useParams } from 'next/navigation';
import { useQuery } from '@tanstack/react-query';
import { normalizeCard } from '@/lib/cardData';
import { getCardCategory } from '@/lib/deckRules';
import { normalizeDeck } from '@/utils/metaDeckHelpers';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL ||
    'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';
const YGO_API = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

const EMPTY_MAP = {};

const fetchDeck = async (id, signal) => {
    const res = await fetch(`${API_BASE_URL}/metadecks/${id}`, { signal });
    if (!res.ok) {
        const body = await res.json().catch(() => null);
        throw new Error(body?.message || `Server responded with HTTP ${res.status}`);
    }
    return normalizeDeck(await res.json());
};

/**
 * One request for every distinct card in the deck. The answer also carries the prices, so nothing else needs to ask again.
 * YGOPRODeck answers 400 for the WHOLE request if even one ID is unknown to it (Master Duel decks can contain
 * cards it does not list). So on a 400 we split the list in half and retry each half: the known cards still load
 * and only the unknown ones are left without details.
 */
const fetchCards = async (ids, signal) => {
    if (!ids.length) return {};
    const res = await fetch(`${YGO_API}?id=${ids.join(',')}`, { signal });
    if (res.status === 400 || res.status === 404) {
        if (ids.length === 1) return {};
        const mid = Math.ceil(ids.length / 2);
        const [left, right] = await Promise.all([fetchCards(ids.slice(0, mid), signal), fetchCards(ids.slice(mid), signal)]);
        return { ...left, ...right };
    }
    if (!res.ok) throw new Error('Could not load card details.');
    const json = await res.json();
    const map = {};
    (json?.data || []).forEach((card) => { map[String(card.id)] = normalizeCard(card); });
    return map;
};

/**
 * Loads one deck and the details of its cards.
 * Note what is NOT here any more: the hovered / pinned card. That lives in cardFocusStore, so hovering
 * never re-renders this hook's owner.
 */
export function useMetaDeckProfile() {
    const params = useParams();
    const id = params?.id;
    const validId = Boolean(id) && id !== 'undefined';

    const deckQuery = useQuery({
        queryKey: ['metaDeck', id],
        queryFn: ({ signal }) => fetchDeck(id, signal),
        enabled: validId,
        staleTime: 5 * 60 * 1000,
    });
    const deck = deckQuery.data ?? null;

    const uniqueIds = useMemo(
        () => (deck ? [...new Set([...deck.main, ...deck.extra, ...deck.side].map(String))].filter((cid) => /^\d+$/.test(cid)) : []),
        [deck]
    );

    const cardsQuery = useQuery({
        queryKey: ['metaDeckCards', uniqueIds.join(',')],
        queryFn: ({ signal }) => fetchCards(uniqueIds, signal),
        enabled: uniqueIds.length > 0,
        staleTime: 60 * 60 * 1000,
        retry: 1,
    });
    const cardMap = cardsQuery.data ?? EMPTY_MAP;

    // Each of these is calculated once per deck / card list, not once per render.
    const mainCards = useMemo(() => (deck ? deck.main.map((cid) => cardMap[String(cid)]).filter(Boolean) : []), [deck, cardMap]);
    const extraCards = useMemo(() => (deck ? deck.extra.map((cid) => cardMap[String(cid)]).filter(Boolean) : []), [deck, cardMap]);
    const sideCards = useMemo(() => (deck ? deck.side.map((cid) => cardMap[String(cid)]).filter(Boolean) : []), [deck, cardMap]);
    const allCards = useMemo(() => [...mainCards, ...extraCards, ...sideCards], [mainCards, extraCards, sideCards]);

    const cardCounts = useMemo(() => {
        const counts = { monsters: 0, spells: 0, traps: 0 };
        if (!deck) return counts;
        deck.main.forEach((cid) => {
            const info = cardMap[String(cid)];
            const category = info ? getCardCategory(info) : 'monster'; // unknown cards count as monsters, as before
            if (category === 'spell') counts.spells += 1;
            else if (category === 'trap') counts.traps += 1;
            else counts.monsters += 1;
        });
        return counts;
    }, [deck, cardMap]);

    return {
        id,
        deck,
        loading: validId ? deckQuery.isPending : false,
        error: validId ? (deckQuery.error ? deckQuery.error.message : null) : 'Invalid Deck ID provided.',
        refetch: deckQuery.refetch,
        cardsLoading: cardsQuery.isPending && uniqueIds.length > 0,
        cardMap, cardCounts, mainCards, extraCards, sideCards, allCards,
    };
}
