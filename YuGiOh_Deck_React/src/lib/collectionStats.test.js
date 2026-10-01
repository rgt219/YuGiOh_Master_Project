// Works with Jest, Vitest (globals on) and `bun test`.
import { summarizeCollection } from './collectionStats';

describe('summarizeCollection', () => {
    it('counts distinct cards, total copies and value', () => {
        const owned = { 1: 3, 2: 1 };
        const cards = { 1: { price: 2 }, 2: { price: 10.5 } };
        expect(summarizeCollection(owned, cards)).toEqual({ uniqueCards: 2, totalCopies: 4, value: 16.5 });
    });

    it('ignores cards with zero copies', () => {
        expect(summarizeCollection({ 1: 0, 2: 2 }, { 2: { price: 1 } })).toEqual({ uniqueCards: 1, totalCopies: 2, value: 2 });
    });

    it('treats a missing or null price as free instead of breaking the total', () => {
        const owned = { 1: 2, 2: 2 };
        const cards = { 1: { price: null } };
        expect(summarizeCollection(owned, cards)).toEqual({ uniqueCards: 2, totalCopies: 4, value: 0 });
    });

    it('handles an empty collection', () => {
        expect(summarizeCollection({}, {})).toEqual({ uniqueCards: 0, totalCopies: 0, value: 0 });
    });
});