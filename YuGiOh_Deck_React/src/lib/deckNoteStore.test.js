import { createDeckNoteStore } from './deckNoteStore';   // match your actual export name
import { vi } from 'vitest';

// A fake server: remembers notes per deck, records every request, can be told to fail once.
const makeServer = (initial = []) => {
    const rows = new Map(initial.map((r) => [r.deckId, r]));   // deckId -> { deckId, notes, tags }
    const calls = [];
    let failNext = false;
    const fetchImpl = async (url, options = {}) => {
        calls.push({ url, method: options.method || 'GET', body: options.body });
        if (failNext) { failNext = false; return { ok: false, status: 500, json: async () => ({}) }; }
        if (!options.method) return { ok: true, json: async () => [...rows.values()] };

        const id = decodeURIComponent(url.split('/').pop());
        if (options.method === 'PUT') rows.set(id, { deckId: id, ...JSON.parse(options.body) });
        else rows.delete(id);
        return { ok: true, json: async () => ({}) };
    };
    return { fetchImpl, calls, rows, failNext: () => { failNext = true; } };
};

const build = (server, token = 'abc') =>
    createDeckNoteStore({ apiBase: 'http://api', getToken: () => token, fetchImpl: server.fetchImpl });

const putsOf = (server) => server.calls.filter((c) => c.method === 'PUT');

describe('deck notes store', () => {
    afterEach(() => { vi.useRealTimers(); });
    it('loads the notes from the API', async () => {
        const store = build(makeServer([{ deckId: 'd1', notes: 'Side Nibiru', tags: ['meta'] }]));
        await store.ensureLoaded();
        expect(store.getState().status).toBe('ready');
        expect(store.getDeckNote('d1')).toEqual({ notes: 'Side Nibiru', tags: ['meta'] });
    });

    it('returns an empty note for a deck that has none', async () => {
        const store = build(makeServer());
        await store.ensureLoaded();
        expect(store.getDeckNote('nope')).toEqual({ notes: '', tags: [] });
    });

    it('reports signedOut and makes no request when there is no token', async () => {
        const server = makeServer();
        const store = build(server, null);          // null = logged out

        await store.ensureLoaded();

        expect(store.getState().status).toBe('signedOut');
        expect(server.calls.length).toBe(0);        // nothing was sent to the server
    });

    it('updateDeckNote changes the note at once and marks it dirty', async () => {
        const store = build(makeServer());
        await store.ensureLoaded();

        store.updateDeckNote('d1', { notes: 'hello' });

        expect(store.getDeckNote('d1').notes).toBe('hello');
        expect(store.getState().saveStatus.d1).toBe('dirty');
    });

    it('keeps the notes when a later update only changes the tags', async () => {
        const store = build(makeServer());
        await store.ensureLoaded();

        store.updateDeckNote('d1', { notes: 'hello' });
        store.updateDeckNote('d1', { tags: ['meta'] });

        expect(store.getDeckNote('d1')).toEqual({ notes: 'hello', tags: ['meta'] });
    });

    it('does not call the API when only editing locally', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();
        const callsAfterLoad = server.calls.length;   // the one GET from loading

        store.updateDeckNote('d1', { notes: 'hello' });

        expect(server.calls.length).toBe(callsAfterLoad);
    });

    it('saveDeckNote sends a PUT with only notes and tags', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();

        store.updateDeckNote('d1', { notes: 'hello' });
        await store.saveDeckNote('d1');                     // await: the save talks to the fake server

        const put = server.calls.find((c) => c.method === 'PUT');
        expect(put.url).toBe('http://api/DeckNote/d1');
        expect(JSON.parse(put.body)).toEqual({ notes: 'hello', tags: [] });   // no userId, no deckId in the body
        expect(store.getState().saveStatus.d1).toBe('saved');
    });

    it('keeps the typed text and shows an error when a save fails', async () => {
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();

        store.updateDeckNote('d1', { notes: 'hello' });
        server.failNext();                                  // the next request returns HTTP 500
        await store.saveDeckNote('d1');

        expect(store.getDeckNote('d1').notes).toBe('hello');     // text NOT rolled back
        expect(store.getState().saveStatus.d1).toBe('error');
        expect(store.getState().error).toMatch(/Could not save/);
    });

    it('asks you to log in instead of calling the API when signed out', async () => {
        const server = makeServer();
        const store = build(server, null);
        await store.ensureLoaded();

        store.updateDeckNote('d1', { notes: 'hello' });
        await store.saveDeckNote('d1');

        expect(store.getState().error).toMatch(/Log in/);
        expect(server.calls.length).toBe(0);
    });

    it('waits for a pause in typing before saving', async () => {
        vi.useFakeTimers();
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();

        store.updateDeckNote('d1', { notes: 'hello' });

        await vi.advanceTimersByTimeAsync(799);
        expect(server.calls.filter((c) => c.method === 'PUT').length).toBe(0);

        await vi.advanceTimersByTimeAsync(1);
        expect(server.calls.filter((c) => c.method === 'PUT').length).toBe(1);
    });

    it('typing again restarts the wait and only the latest text is saved', async () => {
        vi.useFakeTimers();
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();

        store.updateDeckNote('d1', { notes: 'a' });
        await vi.advanceTimersByTimeAsync(500);
        store.updateDeckNote('d1', { notes: 'ab' });         // typing again: the 800 ms wait starts over
        await vi.advanceTimersByTimeAsync(500);
        expect(putsOf(server).length).toBe(0);               // 1000 ms passed in total, still nothing sent

        await vi.advanceTimersByTimeAsync(300);              // 800 ms since the last keystroke
        expect(putsOf(server).length).toBe(1);
        expect(JSON.parse(putsOf(server)[0].body).notes).toBe('ab');
    });

    it('flushDeckNote saves immediately and the timer does not save a second time', async () => {
        vi.useFakeTimers();
        const server = makeServer();
        const store = build(server);
        await store.ensureLoaded();

        store.updateDeckNote('d1', { notes: 'hello' });
        await store.flushDeckNote('d1');
        expect(putsOf(server).length).toBe(1);               // saved without waiting

        await vi.advanceTimersByTimeAsync(1000);
        expect(putsOf(server).length).toBe(1);               // the cancelled timer did not fire again
    });
});