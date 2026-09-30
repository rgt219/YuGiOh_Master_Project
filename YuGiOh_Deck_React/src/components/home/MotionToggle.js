'use client';

import React, { useEffect, useState } from 'react';
import { toggleMotion, useMotionAllowed } from '@/hooks/useMotion';

/** Small corner button that pauses / plays every video on the page (needed for accessibility: moving content must be stoppable). */
export default function MotionToggle() {
    const allowed = useMotionAllowed();
    const [mounted, setMounted] = useState(false);
    useEffect(() => setMounted(true), []);
    if (!mounted) return null; // avoids a label flash while the server render and the browser disagree

    return (
        <button type="button" className="home-motion-toggle terminal-font" onClick={toggleMotion}>
            {allowed ? '⏸ Pause videos' : '▶ Play videos'}
        </button>
    );
}
