'use client';

import React, { useRef } from 'react';

/**
 * Wraps a card so it tilts toward the mouse and a rainbow shine follows the pointer (see binder.css, ".holo").
 *
 * How it works: on every mouse move we work out where the pointer is inside the card (0 to 1 across, 0 to 1 down)
 * and store that in four CSS variables (--rx, --ry for the tilt, --mx, --my for the shine position).
 * The CSS does all of the drawing. React never re-renders while you move the mouse.
 */
export default function HoloCard({ children, className = '' }) {
    const ref = useRef(null);
    const frame = useRef(0);

    const handleMove = (event) => {
        const element = ref.current;
        if (!element) return;
        const box = element.getBoundingClientRect();
        const x = (event.clientX - box.left) / box.width;   // 0 = left edge, 1 = right edge
        const y = (event.clientY - box.top) / box.height;   // 0 = top edge, 1 = bottom edge

        cancelAnimationFrame(frame.current); // at most one update per screen refresh
        frame.current = requestAnimationFrame(() => {
            element.style.setProperty('--rx', `${((0.5 - y) * 16).toFixed(2)}deg`);
            element.style.setProperty('--ry', `${((x - 0.5) * 16).toFixed(2)}deg`);
            element.style.setProperty('--mx', `${(x * 100).toFixed(1)}%`);
            element.style.setProperty('--my', `${(y * 100).toFixed(1)}%`);
        });
    };

    const handleLeave = () => {
        cancelAnimationFrame(frame.current);
        const element = ref.current;
        if (!element) return;
        element.style.setProperty('--rx', '0deg');
        element.style.setProperty('--ry', '0deg');
    };

    return (
        <div ref={ref} className={`holo ${className}`} onPointerMove={handleMove} onPointerLeave={handleLeave}>
            {children}
        </div>
    );
}