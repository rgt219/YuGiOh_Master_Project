import { useState, useEffect, useCallback } from 'react';

const KEY = 'db-card-size';
const SIZES = ['sm', 'md', 'lg'];

/** Card thumbnail size (small / medium / large), remembered between visits. Storage may be blocked, so it is wrapped in try/catch. */
export function useCardSize(initial = 'md') {
    const [size, setSize] = useState(initial);

    useEffect(() => {
        try {
            const saved = window.localStorage.getItem(KEY);
            if (SIZES.includes(saved)) setSize(saved);
        } catch { /* private window or blocked storage: keep the default */ }
    }, []);

    const update = useCallback((next) => {
        if (!SIZES.includes(next)) return;
        setSize(next);
        try { window.localStorage.setItem(KEY, next); } catch { /* ignore */ }
    }, []);

    return [size, update];
}
