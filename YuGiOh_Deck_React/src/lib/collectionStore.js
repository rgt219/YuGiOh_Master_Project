// The user's card collection, kept OUTSIDE React state (same idea as cardFocusStore.js).
// Many components can show or change the collection (the collection page, a deck's "what do I need"
// panel, a card popup). They all read this one store, so a change in one shows up in all of them,
// and the collection is downloaded once, not once per component.
//
// Pure JS: no React and no browser globals, so it can be tested without a browser.

export const MAX_QUANTITY = 99;

const clamp = (n) => Math.min(MAX_QUANTITY, Math.max(0, Math.trunc(Number(n)) || 0));

/**
 * @param apiBase  e.g. "https://api.example.com/api"
 * @param getToken function returning the login token, or null when logged out
 * @param fetchImpl injectable so tests can fake the network
 */
export function createCollectionStore({ apiBase, getToken, fetchImpl = (...args) => fetch(...args) }) {
    // owned: { "46986414": 3 }  (card id as a string -> copies owned)
    let state = { owned: {}, status: 'idle', error: null }; // status: idle | loading | ready | signedOut | error
    const listeners = new Set();
    const confirmed = {};        // what the server has accepted, per card. Used to undo a failed save.
    const chains = new Map();    // per card: saves run one after another, never at the same time
    let loadedFor = null;        // which token the loaded data belongs to

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
            set({ owned: {}, status: 'signedOut', error: null });
            return;
        }

        loadedFor = token;
        set({ status: 'loading', error: null });
        try {
            const res = await fetchImpl(`${apiBase}/Collection`, { headers: headers(token) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const rows = await res.json();

            const owned = {};
            Object.keys(confirmed).forEach((k) => delete confirmed[k]);
            rows.forEach((row) => {
                owned[String(row.cardId)] = row.quantity;
                confirmed[String(row.cardId)] = row.quantity;
            });
            set({ owned, status: 'ready', error: null });
        } catch (err) {
            loadedFor = null; // allow another try
            set({ status: 'error', error: 'Could not load your collection.' });
        }
    }

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getState: () => state,
        getOwned: (cardId) => state.owned[String(cardId)] || 0,

        /** Loads once; loads again if a different user has logged in since. Safe to call from every component. */
        ensureLoaded() {
            const token = getToken();
            if (state.status === 'loading' && token === loadedFor) return;
            if (state.status === 'ready' && token === loadedFor) return;
            if (!token && state.status === 'signedOut') return;
            return load();
        },

        /**
         * Sets how many copies you own (0 removes the card). The screen updates immediately;
         * the save happens in the background. If it fails, the number goes back to what the server has.
         */
        setQuantity(cardId, quantity) {
            const id = String(cardId);
            const token = getToken();
            if (!token) {
                set({ error: 'Log in to track your collection.' });
                return Promise.resolve();
            }

            const qty = clamp(quantity);
            const owned = { ...state.owned };
            if (qty === 0) delete owned[id]; else owned[id] = qty;
            set({ owned, error: null });

            const previous = chains.get(id) || Promise.resolve();
            const next = previous.then(async () => {
                // If you clicked + five times quickly, only the LAST number needs to be sent.
                const want = state.owned[id] || 0;
                if (want === (confirmed[id] || 0)) return;

                try {
                    const res = await fetchImpl(`${apiBase}/Collection/${encodeURIComponent(id)}`, {
                        method: 'PUT',
                        headers: headers(token),
                        body: JSON.stringify({ quantity: want }),
                    });
                    if (!res.ok) throw new Error(`HTTP ${res.status}`);
                    confirmed[id] = want;
                } catch (err) {
                    const back = { ...state.owned };
                    const old = confirmed[id] || 0;
                    if (old === 0) delete back[id]; else back[id] = old;
                    set({ owned: back, error: 'Could not save that change. Please try again.' });
                }
            });
            chains.set(id, next);
            return next;
        },
    };
}