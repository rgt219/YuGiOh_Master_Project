// Works with Jest, Vitest (globals on) and `bun test`.
import { createNotificationStore, MAX_ITEMS } from './notificationStore';

const note = (id, read = false) => ({
    id, type: 'PriceDrop', title: `Drop ${id}`, message: '$15.00 -> $12.40', link: `/market-listings/x/y?id=${id}`,
    createdAt: '2026-10-06T12:00:00Z', read,
});

// A fake server: serves a list, records every request, and can be told to fail the next one.
const makeServer = (initial = []) => {
    let items = initial;
    const calls = [];
    let failNext = false;
    const fetchImpl = async (url, options = {}) => {
        calls.push({ url, method: options.method || 'GET' });
        if (failNext) { failNext = false; return { ok: false, status: 500, json: async () => ({}) }; }
        if (!options.method) {
            return { ok: true, json: async () => ({ unread: items.filter((n) => !n.read).length, items }) };
        }
        return { ok: true, json: async () => ({}) };
    };
    return { fetchImpl, calls, setItems: (next) => { items = next; }, failNext: () => { failNext = true; } };
};

const build = (server, token = 'abc') =>
    createNotificationStore({ apiBase: 'http://api', getToken: () => token, fetchImpl: server.fetchImpl });

describe('notification store', () => {
    it('loads the list and the unread count', async () => {
        const store = build(makeServer([note('a'), note('b', true)]));
        await store.ensureLoaded();

        const state = store.getState();
        expect(state.status).toBe('ready');
        expect(state.items.length).toBe(2);
        expect(state.unread).toBe(1);
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

    it('adds a live notification to the top, raises the badge and offers it to the toast', async () => {
        const store = build(makeServer([note('a')]));
        await store.ensureLoaded();

        store.receive(note('b'));

        const state = store.getState();
        expect(state.items[0].id).toBe('b');
        expect(state.unread).toBe(2);
        expect(state.latest.id).toBe('b');
    });

    it('ignores a notification it already has', async () => {
        const store = build(makeServer([note('a')]));
        await store.ensureLoaded();

        store.receive(note('a'));

        expect(store.getState().items.length).toBe(1);
        expect(store.getState().unread).toBe(1);
        expect(store.getState().latest).toBe(null);
    });

    it('ignores nonsense pushed at it', async () => {
        const store = build(makeServer());
        await store.ensureLoaded();

        store.receive(null);
        store.receive({});

        expect(store.getState().items.length).toBe(0);
    });

    it('never keeps more than MAX_ITEMS', async () => {
        const store = build(makeServer());
        await store.ensureLoaded();

        for (let i = 0; i < MAX_ITEMS + 10; i++) store.receive(note(`n${i}`));

        expect(store.getState().items.length).toBe(MAX_ITEMS);
        expect(store.getState().items[0].id).toBe(`n${MAX_ITEMS + 9}`); // the newest is kept
    });

    it('hides the toast when dismissed', async () => {
        const store = build(makeServer());
        await store.ensureLoaded();
        store.receive(note('a'));

        store.dismissLatest();

        expect(store.getState().latest).toBe(null);
    });

    it('marks one read: updates at once, then tells the server', async () => {
        const server = makeServer([note('a'), note('b')]);
        const store = build(server);
        await store.ensureLoaded();

        const saving = store.markRead('a');
        expect(store.getState().unread).toBe(1); // before the network answers
        await saving;

        expect(store.getState().items.find((n) => n.id === 'a').read).toBe(true);
        const post = server.calls.find((c) => c.method === 'POST');
        expect(post.url).toBe('http://api/Notifications/a/read');
    });

    it('does not call the server for something that is already read', async () => {
        const server = makeServer([note('a', true)]);
        const store = build(server);
        await store.ensureLoaded();

        await store.markRead('a');

        expect(server.calls.filter((c) => c.method === 'POST').length).toBe(0);
    });

    it('goes back when marking one read fails', async () => {
        const server = makeServer([note('a')]);
        const store = build(server);
        await store.ensureLoaded();

        server.failNext();
        await store.markRead('a');

        expect(store.getState().items[0].read).toBe(false);
        expect(store.getState().unread).toBe(1);
        expect(store.getState().error).toMatch(/Could not/);
    });

    it('marks everything read, and goes back if that fails', async () => {
        const server = makeServer([note('a'), note('b')]);
        const store = build(server);
        await store.ensureLoaded();

        await store.markAllRead();
        expect(store.getState().unread).toBe(0);
        expect(server.calls.some((c) => c.url === 'http://api/Notifications/read-all')).toBe(true);

        // second run: make it fail
        const server2 = makeServer([note('a'), note('b')]);
        const store2 = build(server2);
        await store2.ensureLoaded();
        server2.failNext();
        await store2.markAllRead();
        expect(store2.getState().unread).toBe(2);
        expect(store2.getState().items.every((n) => !n.read)).toBe(true);
    });

    it('catches up quietly after a reconnect, without flashing "loading"', async () => {
        const server = makeServer([note('a')]);
        const store = build(server);
        await store.ensureLoaded();

        const seen = [];
        store.subscribe(() => seen.push(store.getState().status));
        server.setItems([note('missed'), note('a')]);   // arrived while the connection was down
        await store.refresh();

        expect(store.getState().items.length).toBe(2);
        expect(seen.includes('loading')).toBe(false);
    });

    it('keeps what it has when a quiet refresh fails', async () => {
        const server = makeServer([note('a')]);
        const store = build(server);
        await store.ensureLoaded();

        server.failNext();
        await store.refresh();

        expect(store.getState().status).toBe('ready');
        expect(store.getState().items.length).toBe(1);
    });

    it('reports an error and allows another try when the first load fails', async () => {
        const server = makeServer([note('a')]);
        const store = build(server);

        server.failNext();
        await store.ensureLoaded();
        expect(store.getState().status).toBe('error');

        await store.ensureLoaded();
        expect(store.getState().status).toBe('ready');
    });
});