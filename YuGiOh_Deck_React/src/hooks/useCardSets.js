import { useQuery } from '@tanstack/react-query';

const YGO_API = 'https://db.ygoprodeck.com/api/v7';
const DAY = 24 * 60 * 60 * 1000;

/** Every card set (booster, structure deck, ...), newest first. One download a day. */
export function useCardSets() {
    return useQuery({
        queryKey: ['cardSets'],
        queryFn: async ({ signal }) => {
            const res = await fetch(`${YGO_API}/cardsets.php`, { signal });
            if (!res.ok) throw new Error(`Set list failed (HTTP ${res.status})`);
            const sets = await res.json();
            return sets
                .map((s) => ({ name: s.set_name, code: s.set_code, count: s.num_of_cards, date: s.tcg_date || '' }))
                .sort((a, b) => b.date.localeCompare(a.date) || a.name.localeCompare(b.name));
        },
        staleTime: DAY,
        gcTime: DAY,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}

/** "LOB-EN001" -> 1, so cards sort the way they are numbered in the set. */
const codeNumber = (code) => {
    const match = /(\d+)\D*$/.exec(code || '');
    return match ? parseInt(match[1], 10) : Number.MAX_SAFE_INTEGER;
};

/** Every card in one set, in set-number order: [{ id, name, code }]. One slot per card, however many rarities it has. */
export function useSetCards(setName) {
    return useQuery({
        queryKey: ['setCards', setName],
        queryFn: async ({ signal }) => {
            const res = await fetch(`${YGO_API}/cardinfo.php?cardset=${encodeURIComponent(setName)}`, { signal });
            if (res.status === 400 || res.status === 404) return [];
            if (!res.ok) throw new Error(`Set lookup failed (HTTP ${res.status})`);
            const json = await res.json();

            return (json.data || [])
                .map((card) => {
                    const entries = (card.card_sets || []).filter((s) => s.set_name === setName);
                    const code = entries.map((e) => e.set_code).sort((a, b) => codeNumber(a) - codeNumber(b))[0] || '';
                    return { id: card.id, name: card.name, code };
                })
                .sort((a, b) => codeNumber(a.code) - codeNumber(b.code) || a.name.localeCompare(b.name));
        },
        enabled: Boolean(setName),
        staleTime: DAY,
        gcTime: DAY,
        retry: 1,
        refetchOnWindowFocus: false,
    });
}