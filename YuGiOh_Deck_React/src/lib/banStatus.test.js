import { indexBanLists, withBanStatus } from './banStatus';

const data = {
    masterduel: [{ id: 68059897, name: 'Maliss <Q> Red Ransom', status: 'Forbidden' }, { id: null, name: 'No match', status: 'Limited' }],
    tcg: [{ id: 1, name: 'A', status: 'Limited' }],
    ocg: [],
};

describe('indexBanLists', () => {
    it('maps card id to status and skips entries without an id', () => {
        const lists = indexBanLists(data);
        expect(lists.masterduel).toEqual({ 68059897: 'Forbidden' });
        expect(lists.tcg).toEqual({ 1: 'Limited' });
        expect(lists.ocg).toEqual({});
    });

    it('copes with a missing list', () => {
        expect(indexBanLists({})).toEqual({ masterduel: {}, tcg: {}, ocg: {} });
    });
});

describe('withBanStatus', () => {
    const lists = indexBanLists(data);

    it('takes Master Duel from the API', () => {
        const card = { id: 68059897, banlist: { masterduel: 'Unlimited', tcg: 'Unlimited', ocg: 'Unlimited' } };
        expect(withBanStatus(card, lists).banlist.masterduel).toBe('Forbidden');
    });

    it('lets the API override TCG, but keeps the YGOPRODeck value when the API has none', () => {
        const a = { id: 1, banlist: { tcg: 'Forbidden', ocg: 'Limited' } };
        expect(withBanStatus(a, lists).banlist).toEqual({ masterduel: 'Unlimited', tcg: 'Limited', ocg: 'Limited' });
    });

    it('returns the card unchanged until the lists have loaded', () => {
        const card = { id: 1, banlist: { tcg: 'Limited' } };
        expect(withBanStatus(card, undefined)).toBe(card);
    });

    it('does not break on a card with no banlist', () => {
        expect(withBanStatus({ id: 5 }, lists).banlist).toEqual({ masterduel: 'Unlimited', tcg: 'Unlimited', ocg: 'Unlimited' });
    });
});