'use client';

import { useSyncExternalStore } from 'react';

/**
 * One shared "is motion allowed?" switch for every video on the home page.
 *
 * Default: follow the visitor's system (no video for "reduce motion" or "data saver").
 * The visitor can override it with the Pause / Play button, and the choice is remembered.
 * Nothing here touches React state, so any number of components can read it cheaply.
 */
const KEY = 'home-motion';
const listeners = new Set();
let choice = null; // 'on' | 'off' | null (null = follow the system)
let ready = false;

function init() {
    if (ready || typeof window === 'undefined') return;
    ready = true;
    try {
        const saved = window.localStorage.getItem(KEY);
        choice = saved === 'on' || saved === 'off' ? saved : null;
    } catch {
        choice = null;
    }
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)');
    if (mq.addEventListener) mq.addEventListener('change', emit);
}

function emit() {
    listeners.forEach((listener) => listener());
}

function systemAllows() {
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const saveData = window.navigator.connection?.saveData === true;
    return !reduce && !saveData;
}

function subscribe(listener) {
    init();
    listeners.add(listener);
    return () => listeners.delete(listener);
}

function getSnapshot() {
    init();
    return choice ? choice === 'on' : systemAllows();
}

export function toggleMotion() {
    init();
    choice = getSnapshot() ? 'off' : 'on';
    try { window.localStorage.setItem(KEY, choice); } catch { /* private mode: fine, just not remembered */ }
    emit();
}

/** true when videos may play. The server render (and first client render) answers false, so no video loads before hydration. */
export function useMotionAllowed() {
    return useSyncExternalStore(subscribe, getSnapshot, () => false);
}
