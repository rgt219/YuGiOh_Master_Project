import { useEffect, useSyncExternalStore } from 'react';
import { createWatchListStore } from '@/lib/watchListStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL ||
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

const getToken = () => {
  try { return typeof window !== 'undefined' ? window.sessionStorage.getItem('token') : null; }
  catch { return null; }
};

// One store for the whole site, so every "Track price" button sees the same list.
const store = createWatchListStore({ apiBase: API_BASE_URL, getToken });

/**
 * const { isWatching, setWatching, status, error } = useWatchList();
 *   isWatching(123456)                              -> true when you are tracking that product
 *   setWatching(123456, true, { cardName, setName, rarity })   -> start tracking
 *   setWatching(123456, false)                      -> stop tracking
 *   status                                          -> 'loading' | 'ready' | 'signedOut' | 'error'
 */
export function useWatchList() {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  useEffect(() => { store.ensureLoaded(); }, []);

  return {
    watching: state.watching,
    status: state.status,
    error: state.error,
    isWatching: store.isWatching,
    setWatching: store.setWatching,
  };
}