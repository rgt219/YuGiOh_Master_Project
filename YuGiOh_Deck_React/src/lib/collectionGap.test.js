import { computeGap, priceOf } from './collectionGap';

const copies = (id, n, extra = {}) => Array.from({ length: n }, () => ({ id, name: `Card ${id}`, ...extra }));

describe('computeGap', () => {
    it('groups copies by card id and counts what is missing', () => {
        const deck = [...copies('1', 3), ...copies('2', 1)];
        const gap = computeGap(deck, { 1: 1 });
        expect(gap.totalCopies).toBe(4);
        expect(gap.ownedCopies).toBe(1);
        expect(gap.missingCopies).toBe(3);
        expect(gap.rows.find((r) => r.id === '1')).toMatchObject({ needed: 3, owned: 1, missing: 2 });
        expect(gap.rows.find((r) => r.id === '2')).toMatchObject({ needed: 1, owned: 0, missing: 1 });
    });

    it('never counts more owned copies than the deck needs', () => {
        const gap = computeGap(copies('1', 2), { 1: 9 });
        expect(gap.ownedCopies).toBe(2);
        expect(gap.missingCopies).toBe(0);
        expect(gap.complete).toBe(true);
        expect(gap.percent).toBe(100);
    });

    it('prices only the missing copies', () => {
        const prices = { card_prices: [{ tcgplayer_price: '2.50' }] };
        const gap = computeGap(copies('1', 3, prices), { 1: 1 });
        expect(gap.missingCost).toBe(5);
    });

    it('treats a missing price as free instead of breaking the total', () => {
        const gap = computeGap(copies('1', 2), {});
        expect(gap.missingCost).toBe(0);
        expect(gap.missingCopies).toBe(2);
    });

    it('matches numeric and string ids', () => {
        const gap = computeGap([{ id: 46986414, name: 'Dark Magician' }], { '46986414': 1 });
        expect(gap.complete).toBe(true);
    });

    it('lists missing cards first, most expensive gap first', () => {
        const deck = [
            ...copies('1', 1, { card_prices: [{ tcgplayer_price: '1' }] }),
            ...copies('2', 1, { card_prices: [{ tcgplayer_price: '9' }] }),
            ...copies('3', 1),
        ];
        const gap = computeGap(deck, { 3: 1 });
        expect(gap.rows.map((r) => r.id)).toEqual(['2', '1', '3']);
    });

    it('handles an empty deck without dividing by zero', () => {
        const gap = computeGap([], {});
        expect(gap).toMatchObject({ totalCopies: 0, percent: 0, complete: false });
    });
});

describe('priceOf', () => {
    it('reads the same shapes DeckPriceWidget does', () => {
        expect(priceOf({ card_prices: [{ tcgplayer_price: '3.1' }] })).toBe(3.1);
        expect(priceOf({ cardPrices: { tcgplayer_price: '4' } })).toBe(4);
        expect(priceOf({})).toBe(0);
    });
});