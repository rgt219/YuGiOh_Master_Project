'use client';

import { useState } from 'react';
import Image from 'next/image';
import styles from './market.module.css';

function ImageWithFallback({ sources, alt, sizes, fit, fallback }) {
    const [sourceIndex, setSourceIndex] = useState(0);
    const src = sources[sourceIndex];

    // Every source failed (or there were none): show a clean placeholder instead of the browser's broken-image icon and alt text.
    // A page can pass its own `fallback` (the sets page draws a generated cover); otherwise a plain "NO IMAGE" box is used.
    if (!src) {
        if (fallback) return fallback;
        return (
            <div className={styles.imagePlaceholder} role="img" aria-label={alt}>
                NO IMAGE
            </div>
        );
    }

    return (
        <Image
            src={src}
            alt={alt}
            fill
            sizes={sizes}
            style={{ objectFit: fit }}
            unoptimized
            onError={() => setSourceIndex((index) => index + 1)} // try the next source in the list
        />
    );
}

/**
 * A card or product image that walks down a list of sources until one loads.
 * The parent must be `position: relative` and have a size, because the image fills it.
 *
 * The `key` restarts the inner component (and its "which source am I on" state) whenever the list changes,
 * which is React's built-in way to reset state without an effect.
 */
export default function TcgImage({ sources, alt, sizes = '200px', fit = 'contain', fallback = null }) {
    const list = sources.filter(Boolean);
    return <ImageWithFallback key={list.join('|')} sources={list} alt={alt} sizes={sizes} fit={fit} fallback={fallback} />;
}
