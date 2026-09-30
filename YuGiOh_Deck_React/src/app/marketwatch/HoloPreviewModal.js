'use client';

import React, { useRef, useState } from 'react';
import { Modal, Button } from 'react-bootstrap';
import { usePriceHistory } from '@/hooks/useMarketApi';
import TcgImage from '@/components/market/TcgImage';
import { TCG_IMAGE } from '@/components/market/marketFormat';

const FONT = { fontFamily: "'Cascadia Mono', monospace" }; // the modal renders in a portal outside the page shell, so it sets its own font

const RESTING_TILT = { rotateX: 0, rotateY: 0, glintX: 50, glintY: 50, active: false };

const fullCover = { position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', pointerEvents: 'none' };

/**
 * The 3D holographic card preview.
 *
 * The tilt state lives HERE, not in MarketWatch. The mouse moves dozens of times a second while you
 * tilt the card; with the state in the parent, each move re-rendered the whole price chart too.
 * Now only this small component re-renders.
 */
export default function HoloPreviewModal({ show, onHide, productId, fallbackName }) {
    const [tilt, setTilt] = useState(RESTING_TILT);
    const cardRef = useRef(null);

    // Already cached by MarketWatch (same query key), so this costs no extra request.
    const { data: history } = usePriceHistory(productId);
    const latest = history && history.length > 0 ? history[history.length - 1] : null;
    const cardName = latest?.cardName || fallbackName || 'Card';
    const rarity = latest?.rarity || '';
    const isStarlight = rarity.toLowerCase().includes('starlight');

    const highResImageUrl = TCG_IMAGE(productId, 'in_1000x1000');
    const fallbackImageUrl = TCG_IMAGE(productId, '200w');

    const handleMouseMove = (event) => {
        if (!cardRef.current) return;
        if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return; // respect the OS "reduce motion" setting
        const rect = cardRef.current.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;
        setTilt({
            rotateX: (y / rect.height - 0.5) * -25,
            rotateY: (x / rect.width - 0.5) * 25,
            glintX: (x / rect.width) * 100,
            glintY: (y / rect.height) * 100,
            active: true,
        });
    };

    const handleMouseLeave = () => setTilt(RESTING_TILT);

    const fade = { transition: tilt.active ? 'none' : 'opacity 0.4s ease' };

    return (
        <Modal show={show} onHide={onHide} centered size="xl" contentClassName="bg-transparent border-0 shadow-none">
            <div className="d-flex flex-column align-items-center justify-content-center p-3" style={FONT}>
                <div
                    className="d-flex justify-content-between align-items-center w-100 mb-3 px-3 py-2 rounded bg-black bg-opacity-75 border border-info border-opacity-50"
                    style={{ maxWidth: '420px' }}
                >
                    <div className="d-flex flex-column">
                        <span className="text-info fw-bold small">{cardName}</span>
                        <span className={isStarlight ? 'text-warning fw-bold' : 'text-white-50'} style={{ fontSize: '0.75rem' }}>
                            RARITY: {rarity ? rarity.toUpperCase() : 'UNKNOWN'}
                        </span>
                    </div>
                    <Button variant="outline-info" size="sm" className="py-0 px-2 fw-bold" onClick={onHide} aria-label="Close preview">
                        ✕
                    </Button>
                </div>

                <div style={{ perspective: '1500px', cursor: 'grab', padding: '20px' }}>
                    <div
                        ref={cardRef}
                        onMouseMove={handleMouseMove}
                        onMouseLeave={handleMouseLeave}
                        style={{
                            width: 'min(420px, 82vw)', // never wider than the screen on a phone
                            aspectRatio: '420 / 613',
                            position: 'relative',
                            borderRadius: '18px',
                            transformStyle: 'preserve-3d',
                            transform: tilt.active
                                ? `rotateX(${tilt.rotateX}deg) rotateY(${tilt.rotateY}deg) scale3d(1.05, 1.05, 1.05)`
                                : 'rotateX(0deg) rotateY(0deg) scale3d(1, 1, 1)',
                            transition: tilt.active ? 'none' : 'transform 0.5s ease-out',
                            boxShadow: tilt.active
                                ? '0 35px 55px rgba(0, 210, 255, 0.3), 0 0 45px rgba(255, 255, 255, 0.15)'
                                : '0 20px 40px rgba(0, 0, 0, 0.9)',
                            overflow: 'hidden',
                            border: isStarlight ? '2px solid rgba(255, 215, 0, 0.8)' : '2px solid rgba(0, 210, 255, 0.6)',
                        }}
                    >
                        <TcgImage sources={[highResImageUrl, fallbackImageUrl]} alt={cardName} sizes="420px" fit="cover" />

                        {isStarlight ? (
                            <>
                                {/* Starlight Rare: sharp crosshatch grid */}
                                <div
                                    style={{
                                        ...fullCover,
                                        ...fade,
                                        mixBlendMode: 'color-dodge',
                                        opacity: tilt.active ? 0.9 : 0,
                                        backgroundImage: `
                                            repeating-linear-gradient(45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px),
                                            repeating-linear-gradient(-45deg, transparent, transparent 2px, rgba(255,255,255,0.2) 2px, rgba(255,255,255,0.2) 4px)
                                        `,
                                        backgroundPosition: `${tilt.glintX * 0.2}px ${tilt.glintY * 0.2}px`,
                                    }}
                                />
                                {/* Starlight Rare: intense rainbow beam */}
                                <div
                                    style={{
                                        ...fullCover,
                                        ...fade,
                                        width: '200%',
                                        height: '200%',
                                        mixBlendMode: 'color-dodge',
                                        opacity: tilt.active ? 0.8 : 0,
                                        background: `linear-gradient(${tilt.rotateY * 3}deg, transparent 20%, rgba(255,0,128,0.7) 40%, rgba(0,255,255,0.8) 50%, rgba(255,255,0,0.6) 60%, transparent 80%)`,
                                        transform: `translate(${-50 + tilt.glintX * 0.5}%, ${-50 + tilt.glintY * 0.5}%)`,
                                    }}
                                />
                            </>
                        ) : (
                            /* Standard rare: a toned-down, subtle sheen */
                            <div
                                style={{
                                    ...fullCover,
                                    ...fade,
                                    mixBlendMode: 'color-dodge',
                                    opacity: tilt.active ? 0.4 : 0,
                                    background: `linear-gradient(${tilt.rotateY * 2}deg, transparent 20%, rgba(255, 255, 255, 0.2) 40%, rgba(0, 210, 255, 0.3) 50%, transparent 80%)`,
                                }}
                            />
                        )}

                        {/* Specular highlight that follows the pointer, simulating a light source */}
                        <div
                            style={{
                                ...fullCover,
                                ...fade,
                                background: `radial-gradient(circle at ${tilt.glintX}% ${tilt.glintY}%, rgba(255, 255, 255, 0.4) 0%, transparent 50%)`,
                                opacity: tilt.active ? 0.5 : 0,
                            }}
                        />
                    </div>
                </div>
            </div>
        </Modal>
    );
}
