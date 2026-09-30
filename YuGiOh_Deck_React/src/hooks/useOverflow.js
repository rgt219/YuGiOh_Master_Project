import { useEffect, useState } from 'react';

/**
 * How many pixels of the element's text are cut off ("..."). 0 means it all fits.
 * Uses one ResizeObserver per element (the browser tells us when the size changes) instead of a window
 * resize listener plus a timer per badge, and it only updates state when the answer actually changes.
 */
export function useOverflow(ref, text) {
    const [overflow, setOverflow] = useState(0);

    useEffect(() => {
        const el = ref.current;
        if (!el) return undefined;
        const check = () => setOverflow(Math.max(0, el.scrollWidth - el.clientWidth));
        check();
        if (typeof ResizeObserver === 'undefined') return undefined;
        const observer = new ResizeObserver(check);
        observer.observe(el);
        return () => observer.disconnect();
    }, [ref, text]);

    return overflow;
}
