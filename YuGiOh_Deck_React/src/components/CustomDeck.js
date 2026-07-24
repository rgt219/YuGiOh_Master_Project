import React from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { OverlayTrigger, Card, Container, Row, Col } from 'react-bootstrap';

export default function CustomDeck({ mainDeck = [], extraDeck = [], onDeleteCard }) {
    
    const renderCardList = (list) => (
        list.map((card, index) => {
            const displayCard = {
                id: card.id || card.Id,
                instanceId: card.instanceId,
                name: card.name || card.Name || "Unknown Card",
                image: card.image || card.Image,
                desc: card.desc || card.Desc,
                attribute: card.attribute || card.Attribute,
                level: card.level || card.Level || 0,
                race: card.race || card.Race,
                type: card.type || card.Type
            };

            return (
                <OverlayTrigger
                    key={displayCard.instanceId || `${displayCard.id}-${index}`}
                    placement='right'
                    overlay={
                        <Card 
                            style={{ width: '30rem', backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} 
                            text="white" 
                            className="border-info shadow-lg p-2"
                        >
                            <Card.Body>
                                <Container style={{ margin: 0 }}>
                                    <Row>
                                        <Col>
                                            <Card.Title style={{ fontFamily: "Cascadia Mono, monospace" }}>
                                                {displayCard.name}
                                            </Card.Title>
                                        </Col>
                                        <Col xs lg="4" className="text-info text-end">
                                            {displayCard.attribute} {displayCard.level > 0 && `| Lv ${displayCard.level}`}
                                        </Col>
                                    </Row>
                                </Container>
                                <Card.Subtitle className="mb-2 text-muted">
                                    {displayCard.race} / {displayCard.type}
                                </Card.Subtitle>
                                <Card.Text style={{ fontSize: '0.85rem', maxHeight: '150px', overflowY: 'auto' }}>
                                    {displayCard.desc}
                                </Card.Text>
                            </Card.Body>
                        </Card>
                    }>
                    <div 
                        className="gallery__item__small"
                        onClick={() => onDeleteCard && onDeleteCard(displayCard.id, displayCard.instanceId)}
                        style={{ cursor: onDeleteCard ? 'pointer' : 'default' }}
                    >
                        <div className={onDeleteCard ? "clickable-card" : ""}> 
                            <img 
                                src={displayCard.image} 
                                alt={displayCard.name} 
                                className="card-image"
                                onError={(e) => { e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg' }}
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
                <div className="gallery__small" style={{ overflowX: 'visible' }}>
                    {renderCardList(mainDeck)}
                </div>
            </div>

            {extraDeck.length > 0 && (
                <div className="extra-deck-section mt-4 pt-4" style={{ borderTop: '1px solid rgba(0,210,255,0.2)' }}>
                    <h6 className="text-info mb-3" style={{ letterSpacing: '2px' }}>EXTRA_DECK // {extraDeck.length}/15</h6>
                    <div className="gallery__small" style={{ overflowX: 'visible' }}>
                        {renderCardList(extraDeck)}
                    </div>
                </div>
            )}
        </div>
    );
}