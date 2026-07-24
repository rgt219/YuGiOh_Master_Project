import React, { useMemo } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OverlayTrigger, Card, Badge } from 'react-bootstrap';

const getAttributeColor = (attribute) => {
    if (!attribute) return 'dark';
    switch (attribute.toUpperCase()) {
        case 'DARK': return 'dark';
        case 'LIGHT': return 'warning';
        case 'FIRE': return 'danger';
        case 'WATER': return 'primary';
        case 'WIND': return 'success';
        case 'EARTH': return 'secondary';
        case 'DIVINE': return 'warning';
        default: return 'info';
    }
};

// 🚀 Helper to categorize & sort cards: Monsters (1) -> Spells (2) -> Traps (3) -> Alphabetical
const sortDeckCards = (deckList) => {
    if (!deckList || !deckList.length) return [];

    const getCardCategory = (card) => {
        const type = (card.type || card.Type || "").toLowerCase();
        const frameType = (card.frameType || card.FrameType || "").toLowerCase();

        if (type.includes("spell") || frameType === "spell") return 2; // Spells
        if (type.includes("trap") || frameType === "trap") return 3;  // Traps
        return 1; // Monsters (Normal, Effect, Ritual, Pendulum, etc.)
    };

    return [...deckList].sort((a, b) => {
        const catA = getCardCategory(a);
        const catB = getCardCategory(b);

        // 1. First sort by Card Category (Monsters -> Spells -> Traps)
        if (catA !== catB) {
            return catA - catB;
        }

        // 2. Then sort alphabetically by Card Name
        const nameA = (a.name || a.Name || "").toLowerCase();
        const nameB = (b.name || b.Name || "").toLowerCase();
        return nameA.localeCompare(nameB);
    });
};

export default function CustomDeck({ mainDeck = [], extraDeck = [], sideDeck = [], onDeleteCard, cardsPerRow }) {
    
    // 🚀 Automatically sort lists whenever cards are added or removed
    const sortedMainDeck = useMemo(() => sortDeckCards(mainDeck), [mainDeck]);
    const sortedExtraDeck = useMemo(() => sortDeckCards(extraDeck), [extraDeck]);
    const sortedSideDeck = useMemo(() => sortDeckCards(sideDeck), [sideDeck]);

    // Dynamic grid layout with left/right padding and clean gaps
    const gridStyle = cardsPerRow ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`,
        gap: '10px 8px',
        padding: '0 12px',
        width: '100%',
        overflowX: 'visible'
    } : { 
        padding: '0 8px',
        overflowX: 'visible' 
    };

    const renderCardList = (list) => (
        list.map((card, index) => {
            const cardId = card.id || card.Id;
            const displayCard = {
                id: cardId,
                instanceId: card.instanceId,
                name: card.name || card.Name || "Unknown Card",
                image: card.image || card.Image || (cardId ? `https://ygocardstore.blob.core.windows.net/card-images/${cardId}.jpg` : 'https://images.ygoprodeck.com/images/cards/back_high.jpg'),
                fallbackImage: card.card_images?.[0]?.image_url || 'https://images.ygoprodeck.com/images/cards/back_high.jpg',
                desc: card.desc || card.Desc || card.description || "No description available.",
                attribute: card.attribute || card.Attribute || "",
                level: card.level ?? card.Level ?? 0,
                race: card.race || card.Race || "",
                type: card.type || card.Type || "",
                atk: card.atk ?? card.Atk,
                def: card.def ?? card.Def
            };

            return (
                <OverlayTrigger
                    key={displayCard.instanceId || `${displayCard.id}-${index}`}
                    placement='right'
                    overlay={
                        /* SIDE-BY-SIDE HOVER OVERLAY MATCHING CardApi.js */
                        <Card 
                            style={{ width: '50rem', backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} 
                            text="white" 
                            className="border-info shadow-lg p-3"
                        >
                            <Card.Body>
                                <div className="row">
                                    {/* --- Card Image (Left Side) --- */}
                                    <div className="col-md-5 text-center d-flex align-items-center justify-content-center">
                                        <img 
                                            src={displayCard.image} 
                                            alt={displayCard.name}
                                            onError={(e) => { 
                                                e.target.onerror = null; 
                                                e.target.src = displayCard.fallbackImage; 
                                            }}
                                            className="img-fluid rounded mb-2"
                                            style={{
                                                maxHeight: '380px',
                                                boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)'
                                            }}
                                        />
                                    </div>

                                    {/* --- Card Details (Right Side) --- */}
                                    <div className="col-md-7">
                                        <h5 className="fw-bold mb-3 text-white" style={{ fontFamily: "Cascadia Mono, monospace", letterSpacing: '1px' }}>
                                            {displayCard.name}
                                        </h5>

                                        {/* Badges Row */}
                                        <div className="d-flex align-items-center mb-2 flex-wrap gap-1">
                                            {displayCard.type && (
                                                <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                                    {displayCard.type}
                                                </Badge>
                                            )}
                                            {displayCard.race && (
                                                <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                                    {displayCard.race}
                                                </Badge>
                                            )}
                                            {displayCard.attribute && (
                                                <Badge bg={getAttributeColor(displayCard.attribute)} className="ms-auto text-uppercase fs-7 fw-bold">
                                                    {displayCard.attribute}
                                                </Badge>
                                            )}
                                        </div>

                                        {/* Level / Rank Stars */}
                                        {displayCard.level > 0 && (
                                            <div className="mb-2 text-start">
                                                <span className="small text-white-50 fw-bold me-2">Level / Rank:</span>
                                                <span className="text-info fw-bold">{displayCard.level} ★</span>
                                            </div>
                                        )}

                                        {/* ATK / DEF Stat Bar */}
                                        {(displayCard.atk !== undefined && displayCard.atk !== null) && (
                                            <div className="d-flex align-items-center px-3 py-1 mb-3 rounded" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                                <span className="small text-white-50 fw-bold me-2">ATK /</span>
                                                <span className="text-white fw-bold me-4">{displayCard.atk}</span>
                                                
                                                <span className="small text-white-50 fw-bold me-2">DEF /</span>
                                                <span className="text-white fw-bold">{displayCard.def ?? '-'}</span>
                                            </div>
                                        )}

                                        {/* Card Effect Text Box */}
                                        <div className="text-start p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                            <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-2">
                                                Card Effect / Text
                                            </h6>
                                            <p className="text-white-50 m-0" style={{ fontSize: '0.85rem', lineHeight: '1.4', maxHeight: '180px', overflowY: 'auto' }}>
                                                {displayCard.desc}
                                            </p>
                                        </div>
                                    </div>
                                </div>
                            </Card.Body>
                        </Card>
                    }
                >
                    <div 
                        className="gallery__item__small d-flex justify-content-center"
                        onClick={() => onDeleteCard && onDeleteCard(displayCard.id, displayCard.instanceId)}
                        style={{ cursor: onDeleteCard ? 'pointer' : 'default', width: '100%' }}
                    >
                        <div className={onDeleteCard ? "clickable-card" : ""} style={{ width: '92%', margin: '0 auto' }}> 
                            <img 
                                src={displayCard.image} 
                                alt={displayCard.name} 
                                className="card-image"
                                style={{ width: '100%', height: 'auto', borderRadius: '3px', objectFit: 'cover' }}
                                onError={(e) => { 
                                    e.target.onerror = null;
                                    e.target.src = displayCard.fallbackImage; 
                                }}
                            />
                        </div>
                    </div>
                </OverlayTrigger>
            );
        })
    );

    return (
        <div className="deck-display-wrapper">
            <div className="main-deck-section mb-5">
                <h6 className="text-white-50 mb-3" style={{ letterSpacing: '2px', paddingLeft: '12px' }}>MAIN_DECK // {sortedMainDeck.length}</h6>
                <div className="gallery__small" style={gridStyle}>
                    {renderCardList(sortedMainDeck)}
                </div>
            </div>

            {sortedExtraDeck.length > 0 && (
                <div className="extra-deck-section mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,210,255,0.2)' }}>
                    <h6 className="text-info mb-3" style={{ letterSpacing: '2px', paddingLeft: '12px' }}>EXTRA_DECK // {sortedExtraDeck.length}/15</h6>
                    <div className="gallery__small" style={gridStyle}>
                        {renderCardList(sortedExtraDeck)}
                    </div>
                </div>
            )}

            {sortedSideDeck.length > 0 && (
                <div className="side-deck-section mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,210,255,0.2)' }}>
                    <h6 className="text-warning mb-3" style={{ letterSpacing: '2px', paddingLeft: '12px' }}>SIDE_DECK // {sortedSideDeck.length}/15</h6>
                    <div className="gallery__small" style={gridStyle}>
                        {renderCardList(sortedSideDeck)}
                    </div>
                </div>
            )}
        </div>
    );
}