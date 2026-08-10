'use client'; // 👈 Required for carousel state, keyboard listeners, & client events

import React, { useState, useEffect, useCallback } from 'react';
import DeckBoss from './DeckBoss';
import '../mdstyles.css';
import "../styles.css";

export default function DecksGrid({ decks = [], decklist = [], toggleDeckList }) {
    const [searchTerm, setSearchTerm] = useState("");
    const [extraDeckType, setExtraDeckType] = useState("All Extra Deck Types");
    const [rating, setRating] = useState("All");

    // --- CAROUSEL STATE ---
    const [activeIndex, setActiveIndex] = useState(0);

    const matchesSearchTerm = (deck) => deck.title.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesExtraDeckType = (deck) => {
        if (extraDeckType === "All Extra Deck Types") return true;
        return deck.extraDeckType?.toLowerCase() === extraDeckType.toLowerCase();
    };

    const matchesRating = (deck) => {
        switch(rating) {
            case "Good": return deck.rating >= 8;
            case "Ok": return deck.rating >= 5 && deck.rating < 8;
            case "Bad": return deck.rating < 5;
            default: return true;
        }
    };

    const filteredDecks = decks.filter(deck => 
        matchesExtraDeckType(deck) && matchesRating(deck) && matchesSearchTerm(deck)
    );

    // Reset active index when filter results change
    useEffect(() => {
        setActiveIndex(0);
    }, [searchTerm, extraDeckType, rating, decks.length]);

    // Navigation Handlers
    const handlePrev = useCallback(() => {
        if (filteredDecks.length === 0) return;
        setActiveIndex((prev) => (prev === 0 ? filteredDecks.length - 1 : prev - 1));
    }, [filteredDecks.length]);

    const handleNext = useCallback(() => {
        if (filteredDecks.length === 0) return;
        setActiveIndex((prev) => (prev === filteredDecks.length - 1 ? 0 : prev + 1));
    }, [filteredDecks.length]);

    // Keyboard Arrow Key Navigation
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'ArrowLeft') handlePrev();
            if (e.key === 'ArrowRight') handleNext();
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [handlePrev, handleNext]);

    return (
        <div className="container-fluid px-4 py-3">
            {/* Header */}
            <div className="d-flex align-items-center justify-content-between mb-3">
                <h3 className="text-info terminal-font m-0" style={{ letterSpacing: '2px', fontFamily: 'Rajdhani, sans-serif' }}>
                    MY FAVORITE TCG DECKS
                </h3>
                <span className="text-white-50 small" style={{ fontFamily: 'Share Tech Mono, monospace' }}>
                    TOTAL INDEXED: [{filteredDecks.length}]
                </span>
            </div>

            {/* --- 3D COVER FLOW CAROUSEL STAGE --- */}
            {filteredDecks.length === 0 ? (
                <div className="text-center py-5 text-white-50 terminal-font">
                    <h5>NO DECKS MATCH CURRENT FILTER CRITERIA</h5>
                </div>
            ) : (
                <div className="coverflow-wrapper position-relative overflow-hidden py-4">
                    {/* LEFT ARROW BUTTON */}
                    <button 
                        onClick={handlePrev}
                        className="coverflow-arrow arrow-left position-absolute top-50 start-0 translate-middle-y border-0 bg-transparent text-info"
                        aria-label="Previous Deck"
                    >
                        ❮
                    </button>

                    {/* RIGHT ARROW BUTTON */}
                    <button 
                        onClick={handleNext}
                        className="coverflow-arrow arrow-right position-absolute top-50 end-0 translate-middle-y border-0 bg-transparent text-info"
                        aria-label="Next Deck"
                    >
                        ❯
                    </button>

                    {/* CAROUSEL CONTAINER */}
                    <div 
                        className="coverflow-stage d-flex align-items-center justify-content-center"
                        style={{ height: '520px', perspective: '1000px' }}
                    >
                        {filteredDecks.map((deck, index) => {
                            const offset = index - activeIndex;
                            const absOffset = Math.abs(offset);

                            if (absOffset > 3) return null;

                            const translateX = offset * 260;
                            const translateZ = -absOffset * 180;
                            const rotateY = offset === 0 ? 0 : offset > 0 ? -25 : 25;
                            const scale = offset === 0 ? 1 : Math.max(0.7, 1 - absOffset * 0.15);
                            const opacity = offset === 0 ? 1 : Math.max(0.3, 1 - absOffset * 0.35);
                            const zIndex = 100 - absOffset;

                            return (
                                <div
                                    key={deck.id}
                                    onClick={() => setActiveIndex(index)}
                                    className="coverflow-item position-absolute"
                                    style={{
                                        width: '310px',
                                        transition: 'all 0.45s cubic-bezier(0.25, 1, 0.5, 1)',
                                        transform: `translateX(${translateX}px) translateZ(${translateZ}px) rotateY(${rotateY}deg) scale(${scale})`,
                                        opacity: opacity,
                                        zIndex: zIndex,
                                        cursor: offset === 0 ? 'default' : 'pointer',
                                        filter: offset === 0 ? 'drop-shadow(0 0 20px rgba(0, 240, 255, 0.4))' : 'grayscale(35%)'
                                    }}
                                >
                                    <DeckBoss
                                        deck={deck}
                                        toggleDeckList={toggleDeckList}
                                        isDeckListed={decklist.includes(deck.id)}
                                    />
                                </div>
                            );
                        })}
                    </div>

                    {/* INDEX DOTS & PAGINATION INDICATOR */}
                    <div className="d-flex justify-content-center align-items-center gap-2 mt-3">
                        <span className="small text-info terminal-font me-2" style={{ letterSpacing: '1px' }}>
                            [{activeIndex + 1} / {filteredDecks.length}]
                        </span>
                        {filteredDecks.map((_, dotIdx) => (
                            <button
                                key={dotIdx}
                                onClick={() => setActiveIndex(dotIdx)}
                                className={`border-0 rounded-circle transition-all ${dotIdx === activeIndex ? 'bg-info shadow-lg' : 'bg-secondary opacity-50'}`}
                                style={{
                                    width: dotIdx === activeIndex ? '12px' : '8px',
                                    height: dotIdx === activeIndex ? '12px' : '8px',
                                    padding: 0,
                                    transition: 'all 0.2s ease'
                                }}
                            />
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}