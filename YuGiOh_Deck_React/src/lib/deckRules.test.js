// Works with Jest, Vitest (globals on) and `bun test`.
import { LIMITS, canAddCard, validateDeck, sortDeckCards, summarizeGenesys, getDestination, buildCopyMap, getCardId } from './deckRules';
import { parseYdk, buildYdk } from './ydk';

const monster = (id, name = `Monster ${id}`) => ({ id, name, type: 'Effect Monster' });
const spell = (id, name = `Spell ${id}`) => ({ id, name, type: 'Spell Card' });
const fusion = (id) => ({ id, name: `Fusion ${id}`, type: 'Fusion Monster' });
const many = (count, make) => Array.from({ length: count }, (_, i) => make(1000 + i));

describe('getCardId', () => {
    it('reads every card shape as a string', () => {
        expect(getCardId({ id: 123 })).toBe('123');
        expect(getCardId({ Id: '456' })).toBe('456');
        expect(getCardId('789')).toBe('789');
        expect(getCardId(null)).toBe('');
    });
});

describe('canAddCard', () => {
    it('allows a normal add and says where it goes', () => {
        expect(canAddCard({ card: monster(1) })).toEqual({ ok: true, destination: 'main' });
        expect(canAddCard({ card: fusion(2) })).toEqual({ ok: true, destination: 'extra' });
        expect(canAddCard({ card: monster(3), isSideDeck: true })).toEqual({ ok: true, destination: 'side' });
    });

    it('blocks a fourth copy, counting all three sections', () => {
        const result = canAddCard({ card: monster(1, 'Ash Blossom'), main: [monster(1), monster(1)], side: [monster(1)] });
        expect(result.ok).toBe(false);
        expect(result.reason).toContain('Ash Blossom');
    });

    it('blocks full sections with a reason', () => {
        expect(canAddCard({ card: monster(1), main: many(LIMITS.mainMax, monster) }).ok).toBe(false);
        expect(canAddCard({ card: fusion(1), extra: many(LIMITS.extraMax, fusion) }).reason).toMatch(/extra deck is full/i);
        expect(canAddCard({ card: monster(1), isSideDeck: true, side: many(LIMITS.sideMax, monster) }).ok).toBe(false);
    });

    it('rejects cards with no id', () => {
        expect(canAddCard({ card: {} }).ok).toBe(false);
    });
});

describe('validateDeck', () => {
    it('warns when the main deck is under 40 but is not an error', () => {
        const { issues, isLegal } = validateDeck({ main: many(30, monster) });
        expect(issues.map((i) => i.id)).toContain('main-min');
        expect(isLegal).toBe(false); // under 40 is not legal
    });

    it('accepts a 40 card deck', () => {
        const { issues, isLegal } = validateDeck({ main: many(40, monster), extra: many(15, fusion) });
        expect(issues).toHaveLength(0);
        expect(isLegal).toBe(true);
    });

    it('reports too many copies as an error', () => {
        const main = [...many(36, monster), monster(5), monster(5), monster(5), monster(5)];
        const { issues, isLegal } = validateDeck({ main });
        expect(issues.some((i) => i.id === 'copies-5' && i.level === 'error')).toBe(true);
        expect(isLegal).toBe(false);
    });
});

describe('sortDeckCards', () => {
    it('orders monsters, then spells, then by name', () => {
        const sorted = sortDeckCards([spell(1, 'Zed'), monster(2, 'Beta'), spell(3, 'Alpha'), monster(4, 'Alpha')]);
        expect(sorted.map((c) => c.name)).toEqual(['Alpha', 'Beta', 'Alpha', 'Zed']);
        expect(sorted.map((c) => c.type)).toEqual(['Effect Monster', 'Effect Monster', 'Spell Card', 'Spell Card']);
    });
});

describe('getDestination and copies', () => {
    it('routes by card type', () => {
        expect(getDestination({ type: 'Synchro Monster' })).toBe('extra');
        expect(getDestination({ type: 'XYZ Pendulum Effect Monster' })).toBe('extra');
        expect(getDestination({ type: 'Trap Card' })).toBe('main');
    });
    it('counts copies by id', () => {
        expect(buildCopyMap([monster(1), monster(1)], [monster(2)]).get('1')).toBe(2);
    });
});

describe('summarizeGenesys', () => {
    it('adds points and flags Link/Pendulum cards', () => {
        expect(summarizeGenesys([{ id: 1, genesysPoints: 10 }, { id: 2, GenesysPoints: 5 }])).toEqual({ points: 15, hasIllegalCards: false });
        expect(summarizeGenesys([{ id: 1, genesysPoints: 10 }, { id: 3, type: 'Link Monster' }]).hasIllegalCards).toBe(true);
    });
});

describe('ydk', () => {
    const file = '#created by someone\n#main\n111\n222\n#extra\n333\n!side\n444\n';
    it('parses the three sections', () => {
        expect(parseYdk(file)).toEqual({ main: ['111', '222'], extra: ['333'], side: ['444'] });
    });
    it('round-trips', () => {
        expect(parseYdk(buildYdk({ main: ['1', '2'], extra: ['3'], side: ['4'] }))).toEqual({ main: ['1', '2'], extra: ['3'], side: ['4'] });
    });
    it('ignores junk and handles Windows line endings', () => {
        expect(parseYdk('#main\r\n12\r\nnot-a-number\r\n#extra\r\n')).toEqual({ main: ['12'], extra: [], side: [] });
    });
});
