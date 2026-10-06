// Works with Jest, Vitest (globals on) and `bun test`.
import { createWatchListStore } from './watchListStore';

// A fake server: remembers tracked products, records every request, and can be told to fail once.
const makeServer = (initial = []) => {
    const rows = new Set(initial.map((r) => String(r.productId)));
    const calls = [];
    let failNext = false;
    const fetchImpl = async (url, options = {}) => {
        calls.push({ url, method: options.method || 'GET', body: options.body });
        if (failNext) { failNext = false; return { ok: false, status: 500, json: async () => ({}) }; }
        if (!options.method) {
            return { ok: true, json: async () => [...rows].map((productId) => ({ productId: Number(productId) })) };
        }
        const id = decodeURIComponent(url.split('/').pop());
        if (options.method === 'PUT') rows.add(id); else rows.delete(id);
        return { ok: true, json: async () => ({}) };
    };
    return { fetchImpl, calls, rows, failNext: () => { failNext = true; } };
};

const build = (server, token = 'abc') =>
    createWatchListStore({ apiBase: 'http://api', getToken: () => token, fetchImpl: server.fetchImpl });

const card = { cardName: 'Ash Blossom & Joyous Spring', setName: 'Maximum Crisis', rarity: 'Ultra Rare' };

describe('watch list store', () => {
    it('loads the tracked cards from the API', async () => {
        const store = build(makeServer([{ productId: 111 }]));
        await store.ensureLoaded();
        expect(store.getState().status).toBe('ready');
        expect(store.isWatching(111)).toBe(true);
        expect(store.isWatching('999')).toBe(false);
    });

    it('does nothing and reports signedOut when there is no token', async () => {
        const server = makeServer();
        const store = build(server, null);
        await store.ensureLoaded();
        expect(store.getState().status).toBe('signedOut');
        expect(server.calls.length).toBe(0);
    });

    it('loads only once, however many components ask', async () => {
        const server = makeServer();
        const store = build(server);
        await Promise.all([store.ensureLoaded(), store.ensureLoaded(), store.ensureLoaded()]);
        expect(server.calls.filter((c) => c.method === 'GET').length).toBe(1);
    });

    it('tracks a card: updates at once, then sends PUT with the card details', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();

        const saving = store.setWatching(123, true, card);
        expect(store.isWatching(123)).toBe(true); // before the network answers
        await saving;

        const put = server.calls.find((c) => c.method === 'PUT');
        expect(put.url).toBe('http://api/WatchList/123');
        expect(JSON.parse(put.body)).toEqual({ cardName: card.cardName, setName: card.setName, rarity: card.rarity });
        expect(server.rows.has('123')).toBe(true);
    });

    it('untracks a card with DELETE and no body', async () => {
        const server = makeServer([{ productId: 123 }]);
        const store = build(server);
        await store.ensureLoaded();

        await store.setWatching(123, false);

        const del = server.calls.find((c) => c.method === 'DELETE');
        expect(del.url).toBe('http://api/WatchList/123');
        expect(del.body).toBeUndefined();
        expect(store.isWatching(123)).toBe(false);
    });

    it('only sends the last choice when the button is clicked quickly', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();

        store.setWatching(5, true, card);
        store.setWatching(5, false);
        await store.setWatching(5, true, card);

        const writes = server.calls.filter((c) => c.method !== 'GET');
        expect(writes.length).toBe(1);
        expect(writes[0].method).toBe('PUT');
    });

    it('goes back to what the server has when a save fails', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();

        server.failNext();
        await store.setWatching(123, true, card);

        expect(store.isWatching(123)).toBe(false);
        expect(store.getState().error).toMatch(/Could not save/);
    });

    it('asks you to log in instead of calling the API when signed out', async () => {
        const server = makeServer();
        const store = build(server, null);
        await store.ensureLoaded();

        await store.setWatching(123, true, card);

        expect(store.isWatching(123)).toBe(false);
        expect(store.getState().error).toMatch(/Log in/);
        expect(server.calls.length).toBe(0);
    });

    it('reports an error and allows another try when loading fails', async () => {
        const server = makeServer([{ productId: 1 }]);
        const store = build(server);

        server.failNext();
        await store.ensureLoaded();
        expect(store.getState().status).toBe('error');

        await store.ensureLoaded();
        expect(store.getState().status).toBe('ready');
        expect(store.isWatching(1)).toBe(true);
    });
});