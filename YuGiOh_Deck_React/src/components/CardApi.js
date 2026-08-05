import React, { useState, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Form, Row, Col, Card, Spinner, Badge } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';
import '../mdstyles.css';

export const deckList = {
    mainDeck: [], 
    extraDeck: [],
    sideDeck: [],
    id: '',
    title: '',
    userId: ''
};

const AZURE_BLOB_BASE_URL = "https://ygocardstore.blob.core.windows.net/card-images";

const fetchYgoCards = async () => {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    if (!response.ok) throw new Error('NETWORK_ERROR');
    const data = await response.json();

    return data.data.map(card => {
        const extraDeckFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];
        const isExtraDeck = extraDeckFrames.includes(card.frameType?.toLowerCase());

        return {
            ...card,
            isExtraDeck,
            image: `${AZURE_BLOB_BASE_URL}/${card.id}.jpg`,
            fallbackImage: card.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`
        };
    });
};

export default function CardApi({ onAddCard, cardList = [], onInspectCard, onPinCard }) {
    const { 
        data: cards = [], 
        isLoading, 
        isError 
    } = useQuery({
        queryKey: ['ygoCards'],
        queryFn: fetchYgoCards,
        staleTime: 1000 * 60 * 60,
        cacheTime: 1000 * 60 * 60 * 2,
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFrame, setSelectedFrame] = useState('all');
    const [cardLevel, setCardLevel] = useState('');
    const [attribute, setAttribute] = useState('');

    const frameTypes = useMemo(() => ["all", ...new Set(cards.map(card => card.frameType).filter(Boolean))], [cards]);
    const cardLevels = ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const attributes = useMemo(() => ['', ...new Set(cards.map(card => card.attribute).filter(Boolean))], [cards]);

    const filteredCards = useMemo(() => {
        if (!searchTerm && selectedFrame === 'all' && !cardLevel && !attribute) return [];

        const term = searchTerm.toLowerCase();

        return cards.filter(card => {
            const matchesFrame = selectedFrame === 'all' || card.frameType?.toLowerCase() === selectedFrame.toLowerCase();
            const matchesLevel = !cardLevel || card.level === parseInt(cardLevel, 10);
            const matchesAttribute = !attribute || card.attribute?.toUpperCase() === attribute.toUpperCase();
            
            const matchesText = !term || 
                card.name.toLowerCase().includes(term) || 
                (card.desc && card.desc.toLowerCase().includes(term));

            return matchesText && matchesFrame && matchesLevel && matchesAttribute;
        }).slice(0, 40);
    }, [cards, searchTerm, selectedFrame, cardLevel, attribute]);

    const getCardDeckCount = (cardId) => {
        return cardList.filter((c) => (c.id || c.Id) === cardId).length;
    };

    return (
        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 md-panel">
            <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-3">
                <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
                    🔍 CARD DATABASE SEARCH
                </h6>
            </Card.Header>

            <Card.Body className="p-1">
                <Form>
                    <Form.Group className="mb-3">
                        <Form.Control
                            type="search"
                            placeholder="SEARCH BY CARD NAME OR EFFECT TEXT (E.G. 'ALBAZ')..."
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            className="bg-black text-info border-info terminal-font shadow-none"
                            style={{ fontSize: '0.85rem' }}
                        />
                    </Form.Group>

                    <Row className="g-2 mb-3">
                        <Col xs={12} sm={4}>
                            <Form.Select 
                                size="sm" 
                                className="bg-black text-info border-info terminal-font"
                                value={selectedFrame}
                                onChange={(e) => setSelectedFrame(e.target.value)}
                                style={{ fontSize: '0.75rem' }}
                            >
                                <option value="all">FRAME_TYPE (ALL)</option>
                                {frameTypes.filter(f => f !== 'all').map(type => (
                                    <option key={type} value={type}>{type.toUpperCase()}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col xs={6} sm={4}>
                            <Form.Select 
                                size="sm" 
                                className="bg-black text-info border-info terminal-font"
                                value={cardLevel}
                                onChange={(e) => setCardLevel(e.target.value)}
                                style={{ fontSize: '0.75rem' }}
                            >
                                <option value="">LEVEL / RANK</option>
                                {cardLevels.filter(Boolean).map(lvl => (
                                    <option key={lvl} value={lvl}>{lvl} ★</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col xs={6} sm={4}>
                            <Form.Select 
                                size="sm" 
                                className="bg-black text-info border-info terminal-font"
                                value={attribute}
                                onChange={(e) => setAttribute(e.target.value)}
                                style={{ fontSize: '0.75rem' }}
                            >
                                <option value="">ATTRIBUTE</option>
                                {attributes.filter(Boolean).map(attr => (
                                    <option key={attr} value={attr}>{attr.toUpperCase()}</option>
                                ))}
                            </Form.Select>
                        </Col>
                    </Row>
                </Form>

                {isLoading && (
                    <div className="text-center py-4">
                        <Spinner animation="border" variant="info" size="sm" className="mb-2" />
                        <p className="small text-info terminal-font m-0">ACCESSING_MASTER_DATABASE...</p>
                    </div>
                )}

                {isError && (
                    <p className="small text-danger terminal-font text-center py-3">⚠️ DATABASE_OFFLINE</p>
                )}

                {!isLoading && (
                    <div 
                        style={{ 
                            display: 'grid',
                            gridTemplateColumns: 'repeat(6, 1fr)',
                            gap: '8px',
                            maxHeight: '480px', 
                            overflowY: 'auto', 
                            paddingRight: '4px' 
                        }}
                    >
                        {filteredCards.length === 0 && (searchTerm || selectedFrame !== 'all' || cardLevel || attribute) ? (
                            <p className="small text-white-50 terminal-font text-center grid-span-all py-3" style={{ gridColumn: '1 / -1' }}>
                                NO CARDS MATCHING YOUR SEARCH FILTERS
                            </p>
                        ) : filteredCards.length === 0 ? (
                            <p className="small text-white-50 terminal-font text-center grid-span-all py-3" style={{ gridColumn: '1 / -1' }}>
                                TYPE A NAME/EFFECT (E.G. "ALBAZ") OR SELECT A FILTER TO SEARCH...
                            </p>
                        ) : (
                            filteredCards.map((card) => {
                                const countInDeck = getCardDeckCount(card.id);
                                const isMaxedOut = countInDeck >= 3;

                                return (
                                    <div
                                        key={card.id}
                                        className="position-relative card-thumbnail-wrap"
                                        style={{ 
                                            cursor: 'pointer', 
                                            width: '100%',
                                            transition: 'transform 0.15s ease'
                                        }}
                                        onMouseEnter={() => onInspectCard?.(card)}
                                        /* 🖱️ LEFT-CLICK: ADD TO DECK */
                                        onClick={() => {
                                            onInspectCard?.(card);
                                            if (!isMaxedOut) {
                                                onAddCard(card);
                                            }
                                        }}
                                        /* 🖱️ RIGHT-CLICK: LOCK CARD IN INSPECTOR WITHOUT ADDING */
                                        onContextMenu={(e) => {
                                            e.preventDefault();
                                            if (onPinCard) onPinCard(card);
                                        }}
                                        title={isMaxedOut ? "Right-click: Lock Inspector" : "Left-click: Add to deck | Right-click: Lock Inspector"}
                                    >
                                        <img
                                            src={card.image}
                                            alt={card.name}
                                            className={`rounded border ${isMaxedOut ? 'border-danger' : 'border-info border-opacity-50'} w-100`}
                                            style={{ aspectRatio: '421 / 614', objectFit: 'cover' }}
                                            onError={(e) => {
                                                e.target.onerror = null;
                                                e.target.src = card.fallbackImage;
                                            }}
                                        />

                                        {countInDeck > 0 && (
                                            <Badge 
                                                bg={isMaxedOut ? "danger" : "success"} 
                                                className="position-absolute top-0 end-0 m-1 fw-bold shadow-sm"
                                            >
                                                {countInDeck}/3
                                            </Badge>
                                        )}
                                    </div>
                                );
                            })
                        )}
                    </div>
                )}
            </Card.Body>
        </Card>
    );
}