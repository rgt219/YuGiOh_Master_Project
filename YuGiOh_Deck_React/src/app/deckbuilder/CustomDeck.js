import React, { useMemo } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Row, Col } from 'react-bootstrap'; 
import '@/mdstyles.css';

const sortDeckCards = (deckList) => {
    if (!deckList || !deckList.length) return [];

    const getCardCategory = (card) => {
        const type = (typeof card === 'object' ? (card.type || card.Type || "") : "").toLowerCase();
        const frameType = (typeof card === 'object' ? (card.frameType || card.FrameType || "") : "").toLowerCase();

        if (type.includes("spell") || frameType === "spell") return 2;
        if (type.includes("trap") || frameType === "trap") return 3;
        return 1;
    };

    return [...deckList].sort((a, b) => {
        const catA = getCardCategory(a);
        const catB = getCardCategory(b);
        if (catA !== catB) return catA - catB;
        
        const nameA = typeof a === 'object' ? (a.name || a.Name || "") : "";
        const nameB = typeof b === 'object' ? (b.name || b.Name || "") : "";
        return nameA.localeCompare(nameB);
    });
};

export default function CustomDeck({ 
    mainDeck = [], 
    extraDeck = [], 
    sideDeck = [], 
    onDeleteCard, 
    onInspectCard,
    onPinCard
}) {
    const sortedMain = useMemo(() => sortDeckCards(mainDeck), [mainDeck]);
    const sortedExtra = useMemo(() => sortDeckCards(extraDeck), [extraDeck]);
    const sortedSide = useMemo(() => sortDeckCards(sideDeck), [sideDeck]);

    const renderCardGrid = (cardList, sectionBorder) => {
        if (!cardList || cardList.length === 0) {
            return (
                <div className="text-center py-4 text-white-50 small terminal-font border border-secondary border-opacity-25 rounded bg-black bg-opacity-40">
                    NO CARDS ADDED TO THIS SECTION YET
                </div>
            );
        }

        return (
            <div 
                style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(10, minmax(0, 1fr))',
                    gap: '6px',
                    width: '100%',
                    alignContent: 'start' // Ensures cards stay at the top if there's empty space
                }}
            >
                {cardList.map((card, index) => {
                    const cardId = typeof card === 'object' ? (card.id || card.Id) : card;
                    const instanceId = (typeof card === 'object' && card.instanceId) ? card.instanceId : `${cardId}-${index}`;
                    
                    const imgUrl = (typeof card === 'object' && card.image)
                        ? card.image
                        : (typeof card === 'object' && card.card_images?.[0]?.image_url_small)
                            ? card.card_images[0].image_url_small
                            : `https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images/${cardId}.jpg`;

                    return (
                        <div
                            key={`deck-item-${cardId}-${instanceId}-${index}`}
                            className="position-relative card-thumbnail-wrap"
                            style={{ 
                                cursor: 'pointer', 
                                transition: 'transform 0.15s ease, filter 0.15s ease',
                                width: '100%',
                                minWidth: '0' 
                            }}
                            onMouseEnter={() => onInspectCard?.(card)}
                            onClick={() => {
                                if (onPinCard) onPinCard(card);
                                else if (onInspectCard) onInspectCard(card);
                            }}
                            onContextMenu={(e) => {
                                e.preventDefault();
                                if (onDeleteCard) onDeleteCard(cardId, instanceId);
                            }}
                            title="Left-click: Lock Inspector | Right-click: Remove from deck"
                        >
                            <img
                                src={imgUrl}
                                alt={typeof card === 'object' ? (card.name || cardId) : cardId}
                                className={`rounded border ${sectionBorder} w-100`}
                                style={{ aspectRatio: '421 / 614', objectFit: 'cover' }}
                                onError={(e) => {
                                    e.target.onerror = null;
                                    e.target.src = `https://images.ygoprodeck.com/images/cards_small/${cardId}.jpg`;
                                }}
                            />
                        </div>
                    );
                })}
            </div>
        );
    };

    return (
        <Row className="g-4 align-items-stretch">
            {/* 🚀 Main Deck: Scroll removed, body flexes to fill total container height */}
            <Col lg={12} xl={6}>
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 md-panel h-100 d-flex flex-column">
                    <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                        <h5 className="m-0 text-info terminal-font fw-bold">
                            MAIN DECK ({mainDeck.length})
                        </h5>
                        <span className="small text-white-50">Left-click: Lock View | Right-click: Remove</span>
                    </Card.Header>
                    {/* Removed max height and overflow, added flex-grow-1 so empty space dynamically fills out the 60-card boundary */}
                    <Card.Body className="p-1 flex-grow-1 d-flex flex-column">
                        {renderCardGrid(sortedMain, 'border-info border-opacity-50')}
                    </Card.Body>
                </Card>
            </Col>

            {/* 🚀 Extra & Side Decks: justify-content-between forces Extra to the top and Side to the absolute bottom */}
            <Col lg={12} xl={6} className="d-flex flex-column justify-content-between">
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-warning border-opacity-50 shadow-lg p-3 md-panel">
                    <Card.Header className="bg-transparent border-bottom border-warning border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                        <h5 className="m-0 text-warning terminal-font fw-bold">
                            EXTRA DECK ({extraDeck.length})
                        </h5>
                        <span className="small text-white-50">Max 15 Cards</span>
                    </Card.Header>
                    <Card.Body className="p-1">
                        {renderCardGrid(sortedExtra, 'border-warning border-opacity-50')}
                    </Card.Body>
                </Card>

                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-success border-opacity-50 shadow-lg p-3 md-panel mt-4">
                    <Card.Header className="bg-transparent border-bottom border-success border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                        <h5 className="m-0 text-success terminal-font fw-bold">
                            SIDE DECK ({sideDeck.length})
                        </h5>
                        <span className="small text-white-50">Max 15 Cards</span>
                    </Card.Header>
                    <Card.Body className="p-1">
                        {renderCardGrid(sortedSide, 'border-success border-opacity-50')}
                    </Card.Body>
                </Card>
            </Col>
        </Row>
    );
}