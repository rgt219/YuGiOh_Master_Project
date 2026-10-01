// Works with Jest, Vitest (globals on) and `bun test`.
import { createCollectionStore } from './collectionStore';

// A fake server: remembers quantities, records every request, and can be told to fail.
const makeServer = (initial = []) => {
    const rows = new Map(initial.map((r) => [String(r.cardId), r.quantity]));
    const calls = [];
    let failNext = false;
    const fetchImpl = async (url, options = {}) => {
        calls.push({ url, method: options.method || 'GET', body: options.body });
        if (failNext) { failNext = false; return { ok: false, status: 500, json: async () => ({}) }; }
        if (!options.method) {
            return { ok: true, json: async () => [...rows].map(([cardId, quantity]) => ({ cardId: Number(cardId), quantity })) };
        }
        const id = url.split('/').pop();
        rows.set(id, JSON.parse(options.body).quantity);
        return { ok: true, json: async () => ({}) };
    };
    return { fetchImpl, calls, rows, failNext: () => { failNext = true; } };
};

const build = (server, token = 'abc') =>
    createCollectionStore({ apiBase: 'http://api', getToken: () => token, fetchImpl: server.fetchImpl });

describe('collection store', () => {
    it('loads the collection from the API', async () => {
        const store = build(makeServer([{ cardId: 111, quantity: 2 }]));
        await store.ensureLoaded();
        expect(store.getState().status).toBe('ready');
        expect(store.getOwned(111)).toBe(2);
        expect(store.getOwned('999')).toBe(0);
    });

    it('does nothing and reports signedOut when there is no token', async () => {
        const server = makeServer();
        const store = build(server, null);
        await store.ensureLoaded();
        expect(store.getState().status).toBe('signedOut');
        expect(server.calls.length).toBe(0);
    });

    it('downloads only once however many components ask', async () => {
        const server = makeServer();
        const store = build(server);
        await Promise.all([store.ensureLoaded(), store.ensureLoaded(), store.ensureLoaded()]);
        expect(server.calls.filter((c) => c.method === 'GET').length).toBe(1);
    });

    it('updates the screen immediately and saves in the background', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();
        const saving = store.setQuantity(222, 3);
        expect(store.getOwned(222)).toBe(3); // already updated, before the server answered
        await saving;
        expect(server.rows.get('222')).toBe(3);
    });

    it('sends only the last number when you click quickly', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();
        store.setQuantity(333, 1);
        store.setQuantity(333, 2);
        const last = store.setQuantity(333, 3);
        await last;
        const puts = server.calls.filter((c) => c.method === 'PUT');
        expect(puts.length).toBe(1);
        expect(JSON.parse(puts[0].body).quantity).toBe(3);
    });

    it('puts the old number back when a save fails', async () => {
        const server = makeServer([{ cardId: 444, quantity: 1 }]);
        const store = build(server);
        await store.ensureLoaded();
        server.failNext();
        await store.setQuantity(444, 5);
        expect(store.getOwned(444)).toBe(1);
        expect(store.getState().error).toBeTruthy();
    });

    it('keeps quantities between 0 and 99, and 0 removes the card', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();
        await store.setQuantity(555, 500);
        expect(store.getOwned(555)).toBe(99);
        await store.setQuantity(555, -4);
        expect(store.getOwned(555)).toBe(0);
        expect('555' in store.getState().owned).toBe(false);
    });

    it('does not call the API when logged out', async () => {
        const server = makeServer();
        const store = build(server, null);
        await store.setQuantity(666, 2);
        expect(server.calls.length).toBe(0);
        expect(store.getState().error).toBeTruthy();
    });
});