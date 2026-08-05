import React from 'react';
import HoverVideoPlayer from 'react-hover-video-player';
import { Link } from 'react-router-dom';
import "../mdstyles.css";
import "../styles.css";

export default function DeckBoss({ deck, isDeckListed, toggleDeckList }) {

    // Helper for official Extra Deck Badge colors
    const getExtraDeckBadgeClass = (type) => {
        if (!type) return 'badge-default';
        const lower = type.toLowerCase();
        if (lower.includes('fusion')) return 'badge-fusion';
        if (lower.includes('synchro')) return 'badge-synchro';
        if (lower.includes('xyz')) return 'badge-xyz';
        if (lower.includes('link')) return 'badge-link';
        return 'badge-default';
    };

    const getRatingClass = (rating) => {
        if (rating >= 8) return 'rating-good';
        if (rating >= 5) return 'rating-ok';
        return 'rating-bad';
    };

    return (
        <div className="deck-card-container">
            <div className="deck-boss-frame">
                
                {/* 1. Official Extra Deck Badge */}
                {deck.extraDeckType && (
                    <div className={`extra-badge ${getExtraDeckBadgeClass(deck.extraDeckType)}`}>
                        {deck.extraDeckType}
                    </div>
                )}

                {/* 2. Video Preview / Deck Boss Artwork */}
                <div className="video-container" style={{ aspectRatio: '16/10', position: 'relative' }}>
                    <HoverVideoPlayer
                        videoSrc={`videos/${deck.video}`}
                        pausedOverlay={
                            <img 
                                src={`images/${deck.image}`} 
                                alt={deck.title} 
                                onError={(e) => { e.target.src = "/YuGiOh_Deck_React/public/images/cardback.png"; }}
                                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                            />
                        }
                        loadingOverlay={
                            <div className="text-info p-2 small">LOADING_PREVIEW...</div>
                        }
                        loop={true}
                        muted={true}
                    />
                </div>

                {/* 3. Deck Info Overlay Footer */}
                <div className="deck-info-overlay p-3" style={{ background: 'rgba(7, 11, 18, 0.95)' }}>
                    <div className="d-flex align-items-center justify-content-between mb-2">
                        <h5 className="deck-title m-0" style={{ fontFamily: 'Rajdhani, sans-serif', fontWeight: 700, letterSpacing: '1px' }}>
                            <Link to={`/decks/${deck.id}`} className="text-white text-decoration-none">
                                {deck.title}
                            </Link>
                        </h5>
                    </div>
                </div>

            </div>
        </div>
    );
}