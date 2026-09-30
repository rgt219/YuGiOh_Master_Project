import { useSyncExternalStore } from 'react';

/**
 * A tiny "which card am I looking at?" store for the deck profile page.
 *
 * WHY THIS EXISTS: hovering a card used to be React state in the page. Every hover re-rendered the
 * whole page (all 80 thumbnails, the price widget, ...). Here the hover lives OUTSIDE React state;
 * only the components that subscribe (the inspector) re-render when it changes.
 *
 * `hovered` = the card under the mouse, `pinned` = a card the visitor clicked to lock in place.
 */
export function createCardFocusStore(initialHovered = null) {
    let state = { hovered: initialHovered, pinned: null };
    const listeners = new Set();

    const set = (patch) => {
        state = { ...state, ...patch };
        listeners.forEach((listener) => listener());
    };

    return {
        subscribe(listener) {
            listeners.add(listener);
            return () => listeners.delete(listener);
        },
        getState: () => state,
        /** Ignored while a card is pinned, and when nothing changed. */
        hover(card) {
            if (state.pinned || !card || card === state.hovered) return;
            set({ hovered: card });
        },
        /** Clicking the pinned card again unpins it. */
        togglePin(card) {
            if (!card) return;
            set({ pinned: state.pinned && state.pinned.id === card.id ? null : card });
        },
        unpin() {
            if (state.pinned) set({ pinned: null });
        },
    };
}

/** Read one value out of the store. Re-renders the component only when that value changes. */
export function useCardFocus(store, selector) {
    const read = () => selector(store.getState());
    return useSyncExternalStore(store.subscribe, read, read);
}
