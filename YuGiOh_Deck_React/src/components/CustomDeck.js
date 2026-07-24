import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OverlayTrigger, Card, Container, Row, Col, Badge } from 'react-bootstrap';

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

export default function CustomDeck({ mainDeck = [], extraDeck = [], sideDeck = [], onDeleteCard, cardsPerRow }) {
    
    // Explicit 10-column grid style when cardsPerRow={10} is passed
    const gridStyle = cardsPerRow ? {
        display: 'grid',
        gridTemplateColumns: `repeat(${cardsPerRow}, minmax(0, 1fr))`,
        gap: '6px',
        width: '100%',
        overflowX: 'visible'
    } : { overflowX: 'visible' };

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
                        /* 🚀 EXACT SIDE-BY-SIDE HOVER FROM CardApi.js */
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
                        className="gallery__item__small"
                        onClick={() => onDeleteCard && onDeleteCard(displayCard.id, displayCard.instanceId)}
                        style={{ cursor: onDeleteCard ? 'pointer' : 'default', width: '100%' }}
                    >
                        <div className={onDeleteCard ? "clickable-card" : ""}> 
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
                <h6 className="text-white-50 mb-3" style={{ letterSpacing: '2px' }}>MAIN_DECK // {mainDeck.length}</h6>
                <div className="gallery__small" style={gridStyle}>
                    {renderCardList(mainDeck)}
                </div>
            </div>

            {extraDeck.length > 0 && (
                <div className="extra-deck-section mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,210,255,0.2)' }}>
                    <h6 className="text-info mb-3" style={{ letterSpacing: '2px' }}>EXTRA_DECK // {extraDeck.length}/15</h6>
                    <div className="gallery__small" style={gridStyle}>
                        {renderCardList(extraDeck)}
                    </div>
                </div>
            )}

            {sideDeck.length > 0 && (
                <div className="side-deck-section mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,210,255,0.2)' }}>
                    <h6 className="text-warning mb-3" style={{ letterSpacing: '2px' }}>SIDE_DECK // {sideDeck.length}/15</h6>
                    <div className="gallery__small" style={gridStyle}>
                        {renderCardList(sideDeck)}
                    </div>
                </div>
            )}
        </div>
    );
}