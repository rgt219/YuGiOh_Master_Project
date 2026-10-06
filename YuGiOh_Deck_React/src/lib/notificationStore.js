// The user's notifications (the bell), kept OUTSIDE React state, same pattern as collectionStore and watchListStore.
// Two things feed it: a normal download when the site opens (`ensureLoaded`), and live pushes from SignalR (`receive`).
// Whatever the source, the bell and the toast just read this one store.
//
// Pure JS: no React, no SignalR, no browser globals, so it can be tested without a browser.

export const MAX_ITEMS = 50;   // the list never grows without limit, however long the tab stays open
const PAGE_SIZE = 20;

/**
 * @param apiBase   e.g. "https://api.example.com/api"
 * @param getToken  function returning the login token, or null when logged out
 * @param fetchImpl injectable so tests can fake the network
 */
export function createNotificationStore({ apiBase, getToken, fetchImpl = (...args) => fetch(...args) }) {
    // items: [{ id, type, title, message, link, createdAt, read }]   newest first
    // latest: the notification that just arrived live, for the toast. null when there is nothing to show.
    let state = { items: [], unread: 0, latest: null, status: 'idle', error: null }; // status: idle | loading | ready | signedOut | error
    const listeners = new Set();
    let loadedFor = null; // which token the loaded data belongs to

    const set = (patch) => {
        state = { ...state, ...patch };
        listeners.forEach((listener) => listener());
    };

    const headers = (token) => ({ 'Content-Type': 'application/json', Authorization: `Bearer ${token}` });

    /** silent = refresh quietly (no "loading" state), used after SignalR reconnects. */
    async function load({ silent = false } = {}) {
        const token = getToken();
        if (!token) {
            loadedFor = null;
            set({ items: [], unread: 0, latest: null, status: 'signedOut', error: null });
            return;
        }

        loadedFor = token;
        if (!silent) set({ status: 'loading', error: null });
        try {
            const res = await fetchImpl(`${apiBase}/Notifications?limit=${PAGE_SIZE}`, { headers: headers(token) });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const body = await res.json();
            set({ items: body.items || [], unread: body.unread || 0, status: 'ready', error: null });
        } catch (err) {
            if (silent) return; // keep showing what we have
            loadedFor = null;   // allow another try
            set({ status: 'error', error: 'Could not load your notifications.' });
        }
    }

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getState: () => state,

        /** Loads once; loads again if a different user has logged in since. Safe to call from every component. */
        ensureLoaded() {
            const token = getToken();
            if (state.status === 'loading' && token === loadedFor) return;
            if (state.status === 'ready' && token === loadedFor) return;
            if (!token && state.status === 'signedOut') return;
            return load();
        },

        /** Downloads again without a loading flash. Used when the live connection comes back after a break. */
        refresh: () => load({ silent: true }),

        /** Called for each notification pushed live over SignalR. */
        receive(notification) {
            if (!notification || !notification.id) return;
            if (state.items.some((n) => n.id === notification.id)) return; // already have it

            const item = { ...notification, read: Boolean(notification.read) };
            set({
                items: [item, ...state.items].slice(0, MAX_ITEMS),
                unread: state.unread + (item.read ? 0 : 1),
                latest: item,
            });
        },

        /** Hides the toast. */
        dismissLatest: () => set({ latest: null }),

        /** Marks one read. The screen updates at once; if the save fails, it goes back. */
        async markRead(id) {
            const token = getToken();
            const target = state.items.find((n) => n.id === id);
            if (!token || !target || target.read) return;

            const before = { items: state.items, unread: state.unread };
            set({
                items: state.items.map((n) => (n.id === id ? { ...n, read: true } : n)),
                unread: Math.max(0, state.unread - 1),
                error: null,
            });

            try {
                const res = await fetchImpl(`${apiBase}/Notifications/${encodeURIComponent(id)}/read`, { method: 'POST', headers: headers(token) });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } catch (err) {
                set({ ...before, error: 'Could not mark that as read.' });
            }
        },

        /** Marks everything read. Same idea: instant on screen, undone if the save fails. */
        async markAllRead() {
            const token = getToken();
            if (!token || state.unread === 0) return;

            const before = { items: state.items, unread: state.unread };
            set({ items: state.items.map((n) => ({ ...n, read: true })), unread: 0, error: null });

            try {
                const res = await fetchImpl(`${apiBase}/Notifications/read-all`, { method: 'POST', headers: headers(token) });
                if (!res.ok) throw new Error(`HTTP ${res.status}`);
            } catch (err) {
                set({ ...before, error: 'Could not mark everything as read.' });
            }
        },
    };
}