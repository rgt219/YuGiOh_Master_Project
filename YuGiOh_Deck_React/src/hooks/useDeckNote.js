import { useCallback, useEffect, useSyncExternalStore } from 'react';
import { createDeckNoteStore } from '@/lib/deckNoteStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL ||
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

const getToken = () => {
  try { return typeof window !== 'undefined' ? window.sessionStorage.getItem('token') : null; }
  catch { return null; }
};

// One store for the whole site, so every component that shows a deck's note sees the same data.
const store = createDeckNoteStore({ apiBase: API_BASE_URL, getToken });

// The same limits the API enforces (DeckNoteController). Checking here lets the screen warn BEFORE a 400.
export const NOTE_LIMITS = { notes: 300, tags: 10, tagLength: 30 };

// One shared empty note, so a deck with no note gives React the same object every render.
const EMPTY_NOTE = { notes: '', tags: [] };

/**
 * const { notes, tags, saveStatus, setNotes, setTags, flush } = useDeckNote(deckId);
 *   notes / tags  -> what to show (empty until the user writes something)
 *   setNotes(text), setTags(['meta', 'budget'])  -> update on screen now; saved ~800 ms after the last change
 *   flush()       -> save right now (call on blur)
 *   saveStatus    -> 'idle' | 'dirty' | 'saving' | 'saved' | 'error'
 *   status        -> 'loading' | 'ready' | 'signedOut' | 'error'  (the initial download)
 */
export function useDeckNote(deckId) {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  useEffect(() => { store.ensureLoaded(); }, []);

  // Leaving the page (or switching deck) right after typing must not lose the last, not-yet-saved change.
  useEffect(() => {
    if (!deckId) return undefined;
    return () => { store.flushDeckNote(deckId); };
  }, [deckId]);

  const note = (deckId && state.byDeckId[deckId]) || EMPTY_NOTE;

  const setNotes = useCallback((text) => { if (deckId) store.updateDeckNote(deckId, { notes: text }); }, [deckId]);
  const setTags = useCallback((tags) => { if (deckId) store.updateDeckNote(deckId, { tags }); }, [deckId]);
  const flush = useCallback(() => (deckId ? store.flushDeckNote(deckId) : Promise.resolve()), [deckId]);

  const retry = useCallback(() => (deckId ? store.saveDeckNote(deckId) : Promise.resolve()), [deckId]);

  return {
    notes: note.notes,
    tags: note.tags,
    saveStatus: (deckId && state.saveStatus[deckId]) || 'idle',
    status: state.status,
    error: state.error,
    setNotes,
    setTags,
    flush,
    retry,
  };
}