'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useMotionAllowed } from '@/hooks/useMotion';

const SWAP_MS = 6000;
const FADE_MS = 1000;

/**
 * The framed video in the hero. It cross-fades between clips, but unlike before:
 *  - it owns its own timer, so the rest of the page does not re-render every 6 seconds;
 *  - only one clip plays at a time (two only during the 1-second fade);
 *  - it stops entirely when scrolled out of view, or when motion is paused / reduced.
 */
export default function HeroVideo({ sources }) {
    const allowed = useMotionAllowed();
    const boxRef = useRef(null);
    const videoRefs = useRef([]);
    const [visible, setVisible] = useState(true);
    const [index, setIndex] = useState(0);
    const running = allowed && visible;

    useEffect(() => {
        const el = boxRef.current;
        if (!el) return undefined;
        const observer = new IntersectionObserver(([entry]) => setVisible(entry.isIntersecting), { threshold: 0.1 });
        observer.observe(el);
        return () => observer.disconnect();
    }, []);

    useEffect(() => {
        if (!running || sources.length < 2) return undefined;
        const id = setInterval(() => setIndex((i) => (i + 1) % sources.length), SWAP_MS);
        return () => clearInterval(id);
    }, [running, sources.length]);

    useEffect(() => {
        const videos = videoRefs.current;
        if (!running) {
            videos.forEach((v) => v && v.pause());
            return undefined;
        }
        const current = videos[index];
        if (current) {
            const p = current.play();
            if (p) p.catch(() => {});
        }
        // Let the previous clip finish fading out, then stop it.
        const t = setTimeout(() => videos.forEach((v, i) => { if (v && i !== index) v.pause(); }), FADE_MS + 100);
        return () => clearTimeout(t);
    }, [running, index]);

    return (
        <div ref={boxRef} className="home-hero-video rounded-4 shadow-lg overflow-hidden position-relative">
            {allowed ? sources.map((src, i) => (
                <video
                    key={src}
                    ref={(el) => { videoRefs.current[i] = el; }}
                    className="home-hero-video__clip"
                    style={{ opacity: index === i ? 1 : 0 }}
                    src={src}
                    muted
                    loop
                    playsInline
                    aria-hidden="true"
                    tabIndex={-1}
                    preload={i === 0 ? 'auto' : 'metadata'}
                />
            )) : (
                <div className="home-hero-video__still" role="img" aria-label="Gameplay video, paused">
                    Video paused. Use the button in the corner to play it.
                </div>
            )}
        </div>
    );
}
