'use client';

import React, { memo, useEffect, useMemo, useRef, useState } from 'react';
import { useMotionAllowed } from '@/hooks/useMotion';
import { HERO_BG_VIDEO, PANELS, videoUrl } from './homeData';

/**
 * The fixed full-screen background that changes as you scroll.
 *
 * How it knows which video to show: every scroll section in Home carries a data-bg="<id>" attribute
 * ("hero", a panel id, or "off" for the part of the page that hides the background). One
 * IntersectionObserver watches a thin band across the middle of the screen; whichever section is in
 * that band wins. Because the scroll position lives only in this component, scrolling re-renders
 * only these few elements, never the whole page.
 *
 * Cost control: only the active video and its two neighbours are in the page at all. Everything
 * else is unmounted, which is what actually frees the decoder and the memory.
 */
const LAYERS = [
    { id: 'hero', src: HERO_BG_VIDEO, poster: undefined },
    ...PANELS.map((p) => ({ id: p.id, src: videoUrl(p.bgVideo), poster: videoUrl(p.bgPoster) })),
];

const BgLayer = memo(function BgLayer({ layer, active, allowed }) {
    const ref = useRef(null);

    useEffect(() => {
        const video = ref.current;
        if (!video) return;
        if (active) {
            const p = video.play();
            if (p) p.catch(() => {});
        } else {
            video.pause();
        }
    }, [active, allowed]);

    return (
        <div className="home-bg__layer" data-active={active ? 'true' : 'false'} aria-hidden="true">
            {allowed ? (
                <video
                    ref={ref}
                    className="home-bg__media"
                    src={layer.src}
                    poster={layer.poster}
                    muted
                    loop
                    playsInline
                    tabIndex={-1}
                    preload={active ? 'auto' : 'metadata'}
                />
            ) : (
                // Reduced motion / data saver / paused by the visitor: a still image instead of video.
                layer.poster && <div className="home-bg__media" style={{ backgroundImage: `url(${layer.poster})` }} />
            )}
        </div>
    );
});

export default function BackgroundVideos() {
    const allowed = useMotionAllowed();
    const [active, setActive] = useState('hero'); // which layer is showing ('off' = none)
    const [anchor, setAnchor] = useState('hero'); // last real layer, used to decide which neighbours to keep mounted

    useEffect(() => {
        const targets = document.querySelectorAll('[data-bg]');
        if (!targets.length) return undefined;

        const observer = new IntersectionObserver((entries) => {
            entries.forEach((entry) => {
                if (!entry.isIntersecting) return;
                const id = entry.target.dataset.bg;
                setActive(id);
                if (id !== 'off') setAnchor(id);
            });
        }, { rootMargin: '-45% 0px -45% 0px', threshold: 0 });

        targets.forEach((el) => observer.observe(el));
        return () => observer.disconnect();
    }, []);

    const mounted = useMemo(() => {
        const at = Math.max(0, LAYERS.findIndex((l) => l.id === anchor));
        return LAYERS.filter((_, i) => Math.abs(i - at) <= 1);
    }, [anchor]);

    return (
        <div className="home-bg" aria-hidden="true">
            {mounted.map((layer) => (
                <BgLayer key={layer.id} layer={layer} active={active === layer.id} allowed={allowed} />
            ))}
        </div>
    );
}
