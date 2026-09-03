import React from 'react';
import { Card, Row, Col, Badge, Button } from 'react-bootstrap';

const getAttributeColor = (attribute) => {
  if (!attribute) return 'secondary';
  switch (attribute.toUpperCase()) {
    case 'LIGHT': return 'warning';
    case 'DARK': return 'dark';
    case 'FIRE': return 'danger';
    case 'WATER': return 'primary';
    case 'WIND': return 'success';
    case 'EARTH': return 'secondary';
    case 'DIVINE': return 'warning';
    default: return 'info';
  }
};

export default function CardInspector({ pinnedCard, setPinnedCard, inspectedCard, mainDeck, extraDeck, handlePinCard }) {
    const activeCard = pinnedCard || inspectedCard || mainDeck[0] || extraDeck[0] || {
        name: 'DECK BUILDER STUDIO',
        type: 'BUILDER MODE',
        desc: 'Left-click search cards to add. Right-click deck cards to remove. Right-click search cards or Left-click deck cards to lock the inspector view.'
    };

    const activeImageUrl = activeCard.image || activeCard.card_images?.[0]?.image_url ||
        ((activeCard.id || activeCard.Id) ? `https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images/${activeCard.id || activeCard.Id}.jpg` : 'https://images.ygoprodeck.com/images/cards/back_high.jpg');

    return (
        /* 🚀 Removed the outer wrapper div and applied h-100 directly to the Card so it stretches exactly like CardApi does */
        <Card 
            style={{ 
                backgroundColor: 'rgba(10, 13, 20, 0.4)', 
                backdropFilter: 'blur(8px)', 
                border: '1px solid rgba(0, 210, 255, 0.3)', 
                boxShadow: '0 0 15px rgba(0, 210, 255, 0.03)', 
                borderRadius: '6px' 
            }} 
            text="white" 
            className={`shadow-lg p-3 md-panel h-100 d-flex flex-column ${pinnedCard ? 'border-warning' : 'border-info'}`}
        >
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2 flex-shrink-0">
                <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>CARD INSPECTOR</h6>
                {pinnedCard ? (
                    <Badge bg="warning" className="text-dark fw-bold terminal-font text-uppercase px-2 py-1 shadow" style={{ cursor: 'pointer' }} onClick={() => setPinnedCard(null)} title="Click or press ESC to unlock">
                        CARD LOCKED
                    </Badge>
                ) : (
                    <Button variant="outline-info" size="sm" className="terminal-font py-0 px-2 fw-bold" style={{ fontSize: '0.72rem' }} onClick={() => handlePinCard(activeCard)}>
                        LOCK VIEW
                    </Button>
                )}
            </Card.Header>

            {/* 🚀 minHeight: 0 guarantees this flex child doesn't stretch past the fixed window height */}
            <Card.Body className="p-2 d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                
                {/* Top Section: Locked heights ensure it never bounces */}
                <Row className="g-3 align-items-start mb-3 flex-shrink-0">
                    <Col xs={12} xl={5} className="text-center d-flex justify-content-center">
                        <div style={{ height: '260px' }} className="d-flex align-items-center justify-content-center w-100">
                            <img
                                src={activeImageUrl}
                                alt={activeCard.name}
                                className="rounded border border-info border-opacity-50"
                                style={{ maxHeight: '100%', maxWidth: '100%', objectFit: 'contain', boxShadow: pinnedCard ? '0 0 20px rgba(251, 191, 36, 0.4)' : '0 0 15px rgba(0, 240, 255, 0.25)' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'; }}
                            />
                        </div>
                    </Col>

                    <Col xs={12} xl={7} className="d-flex flex-column justify-content-start" style={{ minHeight: '260px' }}>
                        <div style={{ minHeight: '64px' }} className="d-flex align-items-center mb-2">
                            <h4 className="fw-bold m-0 text-white terminal-font">{activeCard.name}</h4>
                        </div>
                        
                        <div style={{ minHeight: '30px' }} className="d-flex align-items-center mb-2 flex-wrap gap-2">
                            {activeCard.type && <Badge bg="dark" className="border border-secondary text-uppercase fs-6 px-2 py-1">{activeCard.type}</Badge>}
                        </div>
                        
                        <div style={{ minHeight: '30px' }} className="d-flex align-items-center mb-3 flex-wrap gap-2">
                            {activeCard.race && <Badge bg="dark" className="border border-secondary text-uppercase fs-6 px-2 py-1">{activeCard.race}</Badge>}
                            {activeCard.attribute && <Badge bg={getAttributeColor(activeCard.attribute)} className="text-uppercase fs-6 fw-bold px-2 py-1">{activeCard.attribute}</Badge>}
                        </div>

                        <div className="mb-3 text-info fw-bold fs-5" style={{ minHeight: '28px' }}>
                            {activeCard.level ? `Level / Rank: ${activeCard.level} ★` : ''}
                        </div>
                        
                        <div style={{ minHeight: '45px' }}>
                            {typeof activeCard.atk === 'number' && (
                                <div className="d-flex align-items-center px-3 py-2 rounded bg-black border border-secondary d-inline-flex" style={{ maxWidth: '100%' }}>
                                    <span className="text-white-50 me-2 fw-bold" style={{ fontSize: '0.9rem' }}>ATK /</span>
                                    <span className="text-white fw-bold fs-5 me-3">{activeCard.atk}</span>
                                    <span className="text-white-50 me-2 fw-bold" style={{ fontSize: '0.9rem' }}>DEF /</span>
                                    <span className="text-white fw-bold fs-5">{activeCard.def ?? '-'}</span>
                                </div>
                            )}
                        </div>
                    </Col>
                </Row>

                {/* 🚀 Bottom Section: Correct flex properties restore text and keep it locked to a scrollbar */}
                <div className="p-3 rounded bg-black border border-secondary d-flex flex-column flex-grow-1" style={{ minHeight: 0 }}>
                    <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-2 flex-shrink-0">
                        Card Effect / Text
                    </h6>
                    <div className="custom-scrollbar flex-grow-1" style={{ minHeight: 0, overflowY: 'auto', paddingRight: '4px' }}>
                        <p className="text-white-50 m-0" style={{ fontSize: '0.9rem', lineHeight: '1.6' }}>
                            {activeCard.desc || activeCard.effect}
                        </p>
                    </div>
                </div>

            </Card.Body>
        </Card>
    );
}