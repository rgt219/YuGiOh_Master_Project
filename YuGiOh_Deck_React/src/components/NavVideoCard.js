'use client';

import React, { useEffect, useRef, useState } from 'react';
import Card from 'react-bootstrap/Card';
import Link from 'next/link';
import { useMotionAllowed } from '@/hooks/useMotion';

/**
 * Nav card: a still image that plays a short clip on hover or keyboard focus.
 *
 * Changes from before:
 *  - The clip is NOT downloaded up front. `preload="none"` until the card is within ~600px of the
 *    screen, then only the first bytes ("metadata"); the rest streams when it is played.
 *  - Keyboard focus plays it too (it used to be mouse only).
 *  - Touch screens have no hover, so there the clip plays while the card is mostly on screen.
 *  - Nothing plays when the visitor has reduced motion / data saver on, or pressed "Pause videos".
 */
export default function NavVideoCard({ link }) {
    const boxRef = useRef(null);
    const videoRef = useRef(null);
    const motionAllowed = useMotionAllowed();
    const [near, setNear] = useState(false);
    const [active, setActive] = useState(false);

    const hasVideo = Boolean(link.video) && motionAllowed;

    useEffect(() => {
        const el = boxRef.current;
        if (!el || !hasVideo) return undefined;

        const nearObserver = new IntersectionObserver(([entry]) => {
            if (entry.isIntersecting) setNear(true);
        }, { rootMargin: '600px 0px' });
        nearObserver.observe(el);

        let viewObserver = null;
        const touchOnly = !window.matchMedia('(hover: hover)').matches;
        if (touchOnly) {
            viewObserver = new IntersectionObserver(([entry]) => setActive(entry.intersectionRatio >= 0.6), { threshold: [0, 0.6, 1] });
            viewObserver.observe(el);
        }

        return () => {
            nearObserver.disconnect();
            if (viewObserver) viewObserver.disconnect();
        };
    }, [hasVideo]);

    useEffect(() => {
        const video = videoRef.current;
        if (!video) return;
        if (active) {
            video.currentTime = 0;
            const p = video.play();
            if (p) p.catch(() => {});
        } else {
            video.pause();
        }
    }, [active, hasVideo]);

    // Touch devices fire fake mouse events on tap; pointerType lets us ignore them.
    const onPointerEnter = (e) => { if (e.pointerType !== 'touch') setActive(true); };
    const onPointerLeave = (e) => { if (e.pointerType !== 'touch') setActive(false); };

    return (
        <Card
            as={Link}
            href={link.path}
            onPointerEnter={onPointerEnter}
            onPointerLeave={onPointerLeave}
            onFocus={() => setActive(true)}
            onBlur={() => setActive(false)}
            className="md-nav-card flex-grow-1 flex-sm-grow-0 overflow-hidden border-0 shadow-lg"
            style={{ width: '100%', maxWidth: '300px', textDecoration: 'none', cursor: 'pointer', backgroundColor: '#0a0d14' }}
        >
            <div ref={boxRef} className="md-card-img-container" style={{ position: 'relative', width: '100%', backgroundColor: '#0a0d14' }}>
                <Card.Img
                    src={link.img}
                    alt=""
                    loading="lazy"
                    decoding="async"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.8 }}
                />
                {hasVideo && (
                    <video
                        ref={videoRef}
                        src={link.video}
                        muted
                        loop
                        playsInline
                        disablePictureInPicture
                        disableRemotePlayback
                        aria-hidden="true"
                        tabIndex={-1}
                        preload={near ? 'metadata' : 'none'}
                        style={{
                            position: 'absolute', top: 0, left: 0, width: '100%', height: '100%',
                            objectFit: 'cover', opacity: active ? 1 : 0, transition: 'opacity 0.25s ease-in-out', pointerEvents: 'none',
                        }}
                    />
                )}
            </div>
            <Card.Body className="p-0">
                <div className="md-card-overlay-text text-center py-2 text-info terminal-font fw-bold border-top border-info border-opacity-50" style={{ backgroundColor: 'rgba(10, 13, 20, 0.9)' }}>
                    {link.label}
                </div>
            </Card.Body>
        </Card>
    );
}
