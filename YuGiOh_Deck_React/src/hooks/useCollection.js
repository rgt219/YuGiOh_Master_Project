import { useEffect, useSyncExternalStore } from 'react';
import { createCollectionStore } from '@/lib/collectionStore';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL ||
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

const getToken = () => {
  try { return typeof window !== 'undefined' ? window.sessionStorage.getItem('token') : null; }
  catch { return null; }
};

// One store for the whole site, so every component sees the same collection.
const store = createCollectionStore({ apiBase: API_BASE_URL, getToken });

/**
 * const { owned, getOwned, setQuantity, status, error } = useCollection();
 *   getOwned(46986414)          -> how many copies you own
 *   setQuantity(46986414, 3)    -> set it to 3 (0 removes the card)
 *   status                      -> 'loading' | 'ready' | 'signedOut' | 'error'
 */
export function useCollection() {
  const state = useSyncExternalStore(store.subscribe, store.getState, store.getState);

  useEffect(() => { store.ensureLoaded(); }, []);

  return {
    owned: state.owned,
    status: state.status,
    error: state.error,
    getOwned: store.getOwned,
    setQuantity: store.setQuantity,
  };
}