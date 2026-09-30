'use client';

import { useRef } from 'react';
import Link from 'next/link';
import TcgImage from './TcgImage';
import { coverColors, cssUrl, setInitials } from './marketFormat';
import styles from './market.module.css';

const MAX_TILT_DEGREES = 14;

/** Drawn when a set has no picture: a gradient picked from the set's name, with its initials. Always the same for the same set. */
function GeneratedCover({ name }) {
    const colors = coverColors(name);
    return (
        <div
            className={styles.generatedCover}
            role="img"
            aria-label={name}
            style={{ '--cover-from': colors.from, '--cover-to': colors.to, '--cover-accent': colors.accent }}
        >
            <span className={styles.generatedInitials}>{setInitials(name)}</span>
        </div>
    );
}

/**
 * One set on the sets page. The pack tilts toward the mouse and catches a moving glint.
 *
 * The tilt is written straight into CSS variables with a ref. It is NOT React state, so moving the mouse
 * over a tile never re-renders React (30 tiles x dozens of mouse events a second would add up).
 */
export default function SetTile({ name, imageUrl, href }) {
    const artRef = useRef(null);

    const handlePointerMove = (event) => {
        if (event.pointerType !== 'mouse') return; // touch screens have no hover, so no tilt
        const art = artRef.current;
        if (!art || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
        const rect = art.getBoundingClientRect();
        const x = Math.min(1, Math.max(0, (event.clientX - rect.left) / rect.width)); // 0 = left edge, 1 = right edge
        const y = Math.min(1, Math.max(0, (event.clientY - rect.top) / rect.height)); // 0 = top edge, 1 = bottom edge
        art.style.setProperty('--rx', `${(0.5 - y) * 2 * MAX_TILT_DEGREES}deg`);
        art.style.setProperty('--ry', `${(x - 0.5) * 2 * MAX_TILT_DEGREES}deg`);
        art.style.setProperty('--gx', `${x * 100}%`);
        art.style.setProperty('--gy', `${y * 100}%`);
    };

    const handlePointerLeave = () => {
        const art = artRef.current;
        if (!art) return;
        ['--rx', '--ry', '--gx', '--gy'].forEach((property) => art.style.removeProperty(property)); // back to flat
    };

    return (
        <Link href={href} className={styles.tile} onPointerMove={handlePointerMove} onPointerLeave={handlePointerLeave}>
            <div className={styles.setArt}>
                {/* The same picture, blurred and dimmed, fills the space around boxes and wide products so every tile looks full. */}
                {imageUrl && <div className={styles.setBackdrop} style={{ '--cover': cssUrl(imageUrl) }} aria-hidden="true" />}
                <div className={styles.tiltArt} ref={artRef}>
                    <div className={styles.artInner}>
                        <TcgImage sources={[imageUrl]} alt={name} sizes="220px" fallback={<GeneratedCover name={name} />} />
                    </div>
                    <div className={styles.glint} aria-hidden="true" />
                </div>
            </div>
            <div className={styles.tileBody}>
                <h2 className={styles.tileTitle} title={name}>{name}</h2>
                <span className={styles.tileCta}>View Cards</span>
            </div>
        </Link>
    );
}
