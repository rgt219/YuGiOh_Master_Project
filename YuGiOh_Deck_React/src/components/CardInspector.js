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
        <div style={{ position: 'sticky', top: '85px', zIndex: 1020, transition: 'top 0.2s ease' }} className="mb-4">
            <Card style={{ backgroundColor: 'rgba(10, 13, 20, 0.4)', backdropFilter: 'blur(8px)', border: '1px solid rgba(0, 210, 255, 0.3)', boxShadow: '0 0 15px rgba(0, 210, 255, 0.03)', borderRadius: '6px' }} text="white" className={`shadow-lg p-3 md-panel ${pinnedCard ? 'border-warning' : 'border-info'}`}>
                <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-3 d-flex justify-content-between align-items-center">
                    <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>CARD INSPECTOR</h6>
                    {pinnedCard ? (
                        <Badge bg="warning" className="text-dark fw-bold terminal-font text-uppercase px-2 py-1 shadow" style={{ cursor: 'pointer' }} onClick={() => setPinnedCard(null)} title="Click or press ESC to unlock">
                            CARD LOCKED (CLICK OR ESC TO UNLOCK)
                        </Badge>
                    ) : (
                        <Button variant="outline-info" size="sm" className="terminal-font py-0 px-2 fw-bold" style={{ fontSize: '0.72rem' }} onClick={() => handlePinCard(activeCard)}>
                            LOCK CURRENT VIEW
                        </Button>
                    )}
                </Card.Header>

                <Card.Body className="p-2">
                    <Row className="g-3 align-items-center">
                        <Col xs={12} sm={4} md={3} className="text-center">
                            <img
                                src={activeImageUrl}
                                alt={activeCard.name}
                                className="img-fluid rounded border border-info border-opacity-50"
                                style={{ maxHeight: '280px', objectFit: 'contain', boxShadow: pinnedCard ? '0 0 20px rgba(251, 191, 36, 0.4)' : '0 0 15px rgba(0, 240, 255, 0.25)' }}
                                onError={(e) => { e.target.onerror = null; e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg'; }}
                            />
                        </Col>

                        <Col xs={12} sm={4} md={4}>
                            <h4 className="fw-bold mb-2 text-white terminal-font">{activeCard.name}</h4>
                            <div className="d-flex align-items-center mb-2 flex-wrap gap-1">
                                {activeCard.type && <Badge bg="dark" className="border border-secondary text-uppercase fs-7">{activeCard.type}</Badge>}
                                {activeCard.race && <Badge bg="dark" className="border border-secondary text-uppercase fs-7">{activeCard.race}</Badge>}
                                {activeCard.attribute && <Badge bg={getAttributeColor(activeCard.attribute)} className="text-uppercase fs-7 fw-bold ms-auto">{activeCard.attribute}</Badge>}
                            </div>
                            {activeCard.level && <div className="mb-2 text-info fw-bold fs-6">Level / Rank: {activeCard.level} ★</div>}
                            {typeof activeCard.atk === 'number' && (
                                <div className="d-flex align-items-center px-3 py-2 rounded bg-black border border-secondary">
                                    <span className="text-white-50 me-2 fw-bold">ATK /</span>
                                    <span className="text-white fw-bold fs-5 me-4">{activeCard.atk}</span>
                                    <span className="text-white-50 me-2 fw-bold">DEF /</span>
                                    <span className="text-white fw-bold fs-5">{activeCard.def ?? '-'}</span>
                                </div>
                            )}
                        </Col>

                        <Col xs={12} sm={4} md={5}>
                            <div className="p-3 rounded bg-black border border-secondary h-100">
                                <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-2">Card Effect / Text</h6>
                                <p className="text-white-50 m-0" style={{ fontSize: '0.85rem', lineHeight: '1.5', maxHeight: '180px', overflowY: 'auto' }}>
                                    {activeCard.desc || activeCard.effect}
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Card.Body>
            </Card>
        </div>
    );
}