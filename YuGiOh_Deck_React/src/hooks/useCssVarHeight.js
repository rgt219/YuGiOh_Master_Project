import { useEffect } from 'react';

/**
 * Keeps a CSS variable (for example --db-dock-h) equal to an element's live height,
 * so layouts can be sized around fixed or sticky bars without guessing pixel values.
 * `target` is a ref object or a CSS selector string.
 */
export function useCssVarHeight(target, name) {
    useEffect(() => {
        const el = typeof target === 'string' ? document.querySelector(target) : target?.current;
        if (!el || typeof ResizeObserver === 'undefined') return undefined;

        const root = document.documentElement;
        const update = () => root.style.setProperty(name, `${el.offsetHeight}px`);
        update();

        const observer = new ResizeObserver(update);
        observer.observe(el);
        return () => {
            observer.disconnect();
            root.style.removeProperty(name); // fall back to the CSS default
        };
    }, [target, name]);
}
