// The cards a user is tracking for price-drop alerts, kept OUTSIDE React state
// (same pattern as collectionStore.js). Every "Track price" button on the site reads this one store,
// so tracking a card in one place shows up everywhere, and the list is downloaded once.
//
// Pure JS: no React and no browser globals, so it can be tested without a browser.

/**
 * @param apiBase   e.g. "https://api.example.com/api"
 * @param getToken  function returning the login token, or null when logged out
 * @param fetchImpl injectable so tests can fake the network
 */
export function createWatchListStore({ apiBase, getToken, fetchImpl = (...args) => fetch(...args) }) {
    // watching: { "123456": true }  (TCGplayer product id as a string -> being tracked)
    let state = { watching: {}, status: 'idle', error: null }; // status: idle | loading | ready | signedOut | error
    const listeners = new Set();
    const confirmed = {};      // what the server has accepted, per product. Used to undo a failed save.
    const chains = new Map();  // per product: saves run one after another, never at the same time
    let loadedFor = null;      // which token the loaded data belongs to

    const set = (patch) => {
        state = { ...state, ...patch };
        listeners.forEach((listener) => listener());
    };

    const headers = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

    async function load() {
        const token = getToken();
        if (!token) {
            loadedFor = null;
            Object.keys(confirmed).forEach((k) => delete confirmed[k]);
            set({ watching: {}, status: 'signedOut', error: null });
            return;
        }

        loadedFor = token;
        set({ status: 'loading', error: null });
        try {
            const res = await fetchImpl(`${apiBase}/WatchList`, { headers: headers(token) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const rows = await res.json();

            const watching = {};
            Object.keys(confirmed).forEach((k) => delete confirmed[k]);
            rows.forEach((row) => {
                watching[String(row.productId)] = true;
                confirmed[String(row.productId)] = true;
            });
            set({ watching, status: 'ready', error: null });
        } catch (err) {
            loadedFor = null; // allow another try
            set({ status: 'error', error: 'Could not load your tracked cards.' });
        }
    }

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getState: () => state,
        isWatching: (productId) => Boolean(state.watching[String(productId)]),

        /** Loads once; loads again if a different user has logged in since. Safe to call from every component. */
        ensureLoaded() {
            const token = getToken();
            if (state.status === 'loading' && token === loadedFor) return;
            if (state.status === 'ready' && token === loadedFor) return;
            if (!token && state.status === 'signedOut') return;
            return load();
        },

        /**
         * Starts or stops tracking a card. The screen updates immediately; the save happens in the background.
         * If it fails, the button goes back to what the server has.
         * `card` = { cardName, setName, rarity } and is only sent when starting to track.
         */
        setWatching(productId, wanted, card = {}) {
            const id = String(productId);
            const token = getToken();
            if (!token) {
                set({ error: 'Log in to track card prices.' });
                return Promise.resolve();
            }

            const watching = { ...state.watching };
            if (wanted) watching[id] = true; else delete watching[id];
            set({ watching, error: null });

            const previous = chains.get(id) || Promise.resolve();
            const next = previous.then(async () => {
                // If you clicked the button several times quickly, only the LAST choice needs to be sent.
                const want = Boolean(state.watching[id]);
                if (want === Boolean(confirmed[id])) return;

                try {
                    const res = await fetchImpl(`${apiBase}/WatchList/${encodeURIComponent(id)}`, {
                        method: want ? 'PUT' : 'DELETE',
                        headers: headers(token),
                        body: want
                            ? JSON.stringify({
                                cardName: card.cardName || '',
                                setName: card.setName || '',
                                rarity: card.rarity || '',
                            })
                            : undefined,
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    if (want) confirmed[id] = true; else delete confirmed[id];
                } catch (err) {
                    const back = { ...state.watching };
                    if (confirmed[id]) back[id] = true; else delete back[id];
                    set({ watching: back, error: 'Could not save that change. Please try again.' });
                }
            });
            chains.set(id, next);
            return next;
        },
    };
}