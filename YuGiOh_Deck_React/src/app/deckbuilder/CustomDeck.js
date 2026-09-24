import React, { useMemo } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Row, Col, Badge } from 'react-bootstrap'; 
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

   // 🚀 NEW: Bulletproof calculation handling C# PascalCase, DB snake_case, and nested API data
    const { totalGenesysPoints, hasIllegalCards } = useMemo(() => {
        const allCards = [...mainDeck, ...extraDeck, ...sideDeck];
        let points = 0;
        let illegal = false;

        allCards.forEach(card => {
            if (!card || typeof card !== 'object') return;

            // 1. Catch illegal mechanics regardless of property casing
            const type = (card.type || card.Type || "").toLowerCase();
            const frame = (card.frameType || card.FrameType || "").toLowerCase();
            const isBannedMechanic = card.isLinkOrPendulum === true || 
                                     card.genesysPoints === "N/A" || 
                                     card.GenesysPoints === "N/A" ||
                                     type.includes("link") || type.includes("pendulum") || 
                                     frame.includes("link") || frame.includes("pendulum");

            if (isBannedMechanic) {
                illegal = true;
            } else {
                // 2. Hunt down the points across all possible data shapes
                let pts = 0;
                
                if (card.genesysPoints !== undefined && card.genesysPoints !== null) {
                    pts = card.genesysPoints; // React mapped
                } else if (card.GenesysPoints !== undefined && card.GenesysPoints !== null) {
                    pts = card.GenesysPoints; // C# backend hydrated
                } else if (card.genesys_points !== undefined && card.genesys_points !== null) {
                    pts = card.genesys_points; // Raw DB snake_case
                } else if (card.misc_info && Array.isArray(card.misc_info) && card.misc_info[0]?.genesys_points !== undefined) {
                    pts = card.misc_info[0].genesys_points; // Deep nested raw API data
                }
                
                points += (parseInt(pts) || 0);
            }
        });

        return { totalGenesysPoints: points, hasIllegalCards: illegal };
    }, [mainDeck, extraDeck, sideDeck]);

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
                    gridTemplateColumns: 'repeat(auto-fill, minmax(85px, 1fr))',
                    gap: '6px',
                    width: '100%',
                    alignContent: 'start'
                }}
            >
                {cardList.map((card, index) => {
                    const cardId = typeof card === 'object' ? (card.id || card.Id) : card;
                    const instanceId = (typeof card === 'object' && card.instanceId) ? card.instanceId : `${cardId}-${index}`;
                    
                    const imgUrl = (typeof card === 'object' && card.image)
                        ? card.image
                        : (typeof card === 'object' && card.card_images?.[0]?.image_url_small)
                            ? card.card_images[0].image_url_small
                            : `https://cards.erregeteygo.com/card-images/${cardId}.jpg`;

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

    const getGenesysBadgeColor = () => {
        if (hasIllegalCards) return 'border-danger text-danger';
        if (totalGenesysPoints >= 100) return 'border-danger text-danger';    // Red
        if (totalGenesysPoints >= 75) return 'border-warning text-warning';   // Yellow
        if (totalGenesysPoints >= 50) return 'border-success text-success';   // Green/Yellow
        return 'border-info text-info';                                       // Default Cyan
    };

    return (
        <Row className="g-3">
            {/* EXACTLY 50% WIDTH FOR MAIN DECK */}
            <Col xs={12} lg={6}>
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(0px)' }} text="white" className="border-info shadow-lg p-3 md-panel h-100 d-flex flex-column">
                    <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center flex-wrap gap-2">
                        {/* 🚀 NEW: Integrated the Genesys Point HUD here */}
                        <div className="d-flex align-items-center gap-2 flex-wrap">
                            <h5 className="m-0 text-info terminal-font fw-bold">
                                MAIN DECK ({mainDeck.length})
                            </h5>
                            <Badge 
                                bg="dark" 
                                className={`border ${getGenesysBadgeColor()} px-2 py-1 terminal-font shadow-sm`}
                                style={{ transition: 'all 0.3s ease' }}
                            >
                                GENESYS: {totalGenesysPoints} PTS
                            </Badge>
                            {hasIllegalCards && (
                                <Badge bg="danger" className="text-white border border-danger px-2 py-1 terminal-font shadow-sm">
                                    BANNED CARDS DETECTED
                                </Badge>
                            )}
                        </div>
                        <span className="small text-white-50 d-none d-xl-inline text-end">Left-click: Lock View | Right-click: Remove</span>
                    </Card.Header>
                    <Card.Body className="p-1 flex-grow-1 d-flex flex-column">
                        {renderCardGrid(sortedMain, 'border-info border-opacity-50')}
                    </Card.Body>
                </Card>
            </Col>

            {/* EXACTLY 50% WIDTH FOR EXTRA & SIDE DECKS */}
            <Col xs={12} lg={6} className="d-flex flex-column gap-3">
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(0px)' }} text="white" className="border-warning border-opacity-50 shadow-lg p-3 md-panel">
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

                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(0px)' }} text="white" className="border-success border-opacity-50 shadow-lg p-3 md-panel">
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