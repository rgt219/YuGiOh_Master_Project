/**
 * @param apiBase   e.g. "https://api.example.com/api"
 * @param getToken  function returning the login token, or null when logged out
 * @param fetchImpl injectable so tests can fake the network
 */

export function createDeckNoteStore({ apiBase, getToken, fetchImpl = (...args) => fetch(...args), debounceMs = 800})
{
    const timers = new Map();
    let state = { byDeckId: {}, saveStatus: {}, status :'idle', error: null}
    const confirmed = {};        // top of the factory: last note the server accepted, per deck
    const chains = new Map();    // top of the factory: per-deck save queue
    const listeners = new Set();
    let loadedFor = null;

    const set = (patch) => {
        state = { ...state, ...patch };
        listeners.forEach((listener) => listener());
    }
    const headers = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

    async function load() {
        const token = getToken();
        if(!token) {
            loadedFor = null;
            set({ byDeckId: {}, status: 'signedOut', error: null });
            return;
        }

        loadedFor = token;
        set({ status: 'loading', error: null });

        try {
            const res = await fetchImpl(`${apiBase}/DeckNote`, { headers: headers(token) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const rows = await res.json();
            const byDeckId = {};
            rows.forEach((row) => {
                byDeckId[row.deckId] = {
                    notes: row.notes ?? '',
                    tags: row.tags ?? [],
                };
            });
            set({ byDeckId, status: 'ready', error: null });

        } catch (err) {
            loadedFor = null;
            set({ status: 'error', error: 'Could not load your deck notes...' });
        }

    }
    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getState: () => state,
        ensureLoaded() {
            const token = getToken();
            if (state.status === 'loading' && token === loadedFor) return;
            if (state.status === 'ready' && token === loadedFor) return;
            if (!token && state.status === 'signedOut') return;
            return load();
        },

        getDeckNote(deckId) {
            return state.byDeckId[deckId] ?? { notes: '', tags: [] };
        },

        updateDeckNote(deckId, patch) {
            const current = this.getDeckNote(deckId);   // existing note, or the empty default

            const byDeckId = {
                ...state.byDeckId,
                [deckId]: { ...current, ...patch },     // patch overwrites notes and/or tags
            };
            const saveStatus = { ...state.saveStatus, [deckId]: 'dirty' };

            set({ byDeckId, saveStatus, error: null });
            clearTimeout(timers.get(deckId));
            timers.set(deckId, setTimeout(() => {
                timers.delete(deckId);
                this.saveDeckNote(deckId);
            }, debounceMs));
        },

        // inside the returned object:
        saveDeckNote(deckId) {
            const token = getToken();
            if (!token) { 
                set({ error: 'Log in to save notes.' });
                return Promise.resolve();
             }

            const previous = chains.get(deckId) || Promise.resolve();
            const next = previous.then(async () => {
                const sent = this.getDeckNote(deckId);          // snapshot of what we're sending
                set({ saveStatus: { ...state.saveStatus, [deckId]: 'saving' } });

                // set saveStatus[deckId] = 'saving'
                try {
                    // await fetchImpl(... PUT ... body: JSON.stringify({ notes: sent.notes, tags: sent.tags }))
                    const res = await fetchImpl(`${apiBase}/DeckNote/${encodeURIComponent(deckId)}`, {
                        method: 'PUT',
                        headers: headers(token),
                        body: JSON.stringify({
                            notes: sent.notes,
                            tags: sent.tags
                        })
                    })

                    if (!res.ok) throw new Error(`HTTP ${res.status}`)

                    const now = state.byDeckId[deckId];
                    const unchanged = now.notes === sent.notes && JSON.stringify(now.tags) === JSON.stringify(sent.tags);
                    set({ saveStatus: { ...state.saveStatus, [deckId]: unchanged ? 'saved' : 'dirty' }, error: null });
                } catch (err) {
                    set({
                        saveStatus: { ...state.saveStatus, [deckId]: 'error' },
                        error: 'Could not save your note. Please try again.',
                    });
                }
            });
            chains.set(deckId, next);
            return next;
        },
        flushDeckNote(deckId) {
            if (!timers.has(deckId)) return Promise.resolve();   // nothing pending
            clearTimeout(timers.get(deckId));
            timers.delete(deckId);
            return this.saveDeckNote(deckId);
        },
    }
}