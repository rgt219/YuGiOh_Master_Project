import React, { useState, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, OverlayTrigger, Container, Row, Col, Form, Card, Spinner } from 'react-bootstrap';
import { useQuery } from '@tanstack/react-query';

export const deckList = {
    mainDeck: [], 
    extraDeck: [],
    sideDeck: [],
    id: '',
    title: '',
    userId: ''
};

const AZURE_BLOB_BASE_URL = "https://ygocardstore.blob.core.windows.net/card-images";

// 1. Fetcher maps all card details and image URLs into memory
const fetchYgoCards = async () => {
    const response = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
    if (!response.ok) throw new Error('NETWORK_ERROR');
    const data = await response.json();

    return data.data.map(card => ({
        id: card.id,
        name: card.name,
        type: card.type,
        frameType: card.frameType,
        desc: card.desc,
        atk: card.atk,
        def: card.def,
        level: card.level,
        race: card.race,
        attribute: card.attribute,
        // 🚀 Primary: Azure Blob Storage CDN
        image: `${AZURE_BLOB_BASE_URL}/${card.id}.jpg`,
        // 🛡️ Fallback: Original YGOProDeck URL
        fallbackImage: card.card_images[0].image_url_small
    }));
};

export default function CardApi({ onAddCard, onDeleteCard, cardList }) {
    // 2. React Query caches the entire catalog in RAM for 1-2 hours
    const { 
        data: cards = [], 
        isLoading: queryLoading, 
        isError 
    } = useQuery({
        queryKey: ['ygoCards'],
        queryFn: fetchYgoCards,
        staleTime: 1000 * 60 * 60,      // Keep fresh for 1 hour
        cacheTime: 1000 * 60 * 60 * 2,  // Keep cached for 2 hours
    });

    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFrame, setSelectedFrame] = useState('all');
    const [cardLevel, setCardLevel] = useState('');
    const [attribute, setAttribute] = useState('');
    const [hoveredCardData, setHoveredCardData] = useState(null);

    // 3. INSTANT HOVER: Reads directly from RAM (0ms network delay)
    const handleMouseEnter = (card) => {
        setHoveredCardData(card);
    };

    // Derived values for dropdowns (Memoized to avoid re-calculation on every keystroke)
    const frameTypes = useMemo(() => ["all", ...new Set(cards.map(card => card.frameType))], [cards]);
    const cardLevels = ['', 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];
    const attributes = useMemo(() => ['', ...new Set(cards.map(card => card.attribute).filter(Boolean))], [cards]);

    // Fast filtered slice (Limits results to 60 for ultra-fast DOM rendering)
    const filteredCards = useMemo(() => {
        if (!cards.length) return [];
        const term = searchTerm.toLowerCase();

        const results = cards.filter(card => {
            const matchesFrame = selectedFrame === 'all' || card.frameType === selectedFrame;
            const matchesLevel = !cardLevel || card.level === parseInt(cardLevel);
            const matchesAttribute = !attribute || card.attribute === attribute;
            const matchesText = !term || 
                card.name.toLowerCase().includes(term) || 
                (card.desc && card.desc.toLowerCase().includes(term));

            return matchesText && matchesFrame && matchesLevel && matchesAttribute;
        });

        return results.slice(0, 60); 
    }, [cards, searchTerm, selectedFrame, cardLevel, attribute]);

    // Loading State
    if (queryLoading) return (
        <div className="text-center p-5">
            <Spinner animation="border" variant="info" />
            <div className="text-info mt-2">ACCESSING_MASTER_DATABASE...</div>
        </div>
    );

    // Error State
    if (isError) return <div className="text-danger p-5">ERROR: DATABASE_OFFLINE</div>;

    return (
        <div className="md-api-container">
            <Form>
                {/* Search Bar */}
                <Row className="mb-3">
                    <Col>
                        <Form.Group controlId="cardSearch">
                            <Form.Control
                                type="search"
                                placeholder="SYSTEM_SEARCH: ENTER CARD NAME..."
                                className="md-search-input"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                            />
                        </Form.Group>
                    </Col>
                </Row>

                {/* Filter Dropdowns */}
                <Row className="g-2 mb-4">
                    <Col md={4}>
                        <Form.Select className="md-select-box" onChange={(e) => setSelectedFrame(e.target.value)} value={selectedFrame}>
                            <option value="all">FRAME_TYPE</option>
                            {frameTypes.map(type => <option key={type} value={type}>{type}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={3}>
                        <Form.Select className="md-select-box" onChange={(e) => setCardLevel(e.target.value)} value={cardLevel}>
                            <option value="">LEVEL</option>
                            {cardLevels.map(lvl => <option key={lvl} value={lvl}>{lvl}</option>)}
                        </Form.Select>
                    </Col>
                    <Col md={5}>
                        <Form.Select className="md-select-box" onChange={(e) => setAttribute(e.target.value)} value={attribute}>
                            <option value="">ATTRIBUTE</option>
                            {attributes.map(attr => <option key={attr} value={attr}>{attr}</option>)}
                        </Form.Select>
                    </Col>
                </Row>
            </Form>

            {/* Card Search Gallery */}
            <div className="gallery" style={{ overflowX: 'visible' }}>
                {filteredCards.map(card => (
                    <div key={card.id} className="gallery__item">
                        <div className="card-container">
                            <OverlayTrigger
                                placement="left"
                                onEnter={() => handleMouseEnter(card)}
                                overlay={
                                    <Card style={{ width: '36rem' }} bg="dark" text="white" className="border-info shadow-lg">
                                        <Card.Body>
                                            {hoveredCardData && String(hoveredCardData.id) === String(card.id) ? (
                                                <>
                                                    <Container style={{ margin: 0 }}>
                                                        <Row>
                                                            <Col>
                                                                <Card.Title style={{ fontFamily: "Cascadia Mono" }}>{hoveredCardData.name}</Card.Title>
                                                            </Col>
                                                            <Col xs lg="4" className="text-end">
                                                                {hoveredCardData.attribute} {hoveredCardData.level && `| Lv ${hoveredCardData.level}`}
                                                            </Col>
                                                        </Row>
                                                    </Container>
                                                    <Card.Subtitle className="mb-2 text-muted">{hoveredCardData.race} / {hoveredCardData.type}</Card.Subtitle>
                                                    <Card.Text style={{ fontSize: '0.85rem', maxHeight: '200px', overflowY: 'auto' }}>
                                                        {hoveredCardData.desc}
                                                    </Card.Text>
                                                </>
                                            ) : (
                                                <div className="text-center p-2">
                                                    <span className="text-info">LOADING_DATA...</span>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                }
                            >
                                {/* 4. Optimized Image Tag with Azure CDN & Fallback */}
                                <img 
                                    className="card_details" 
                                    src={card.image} 
                                    alt={card.name}
                                    loading="lazy"
                                    decoding="async"
                                    onError={(e) => {
                                        e.target.onerror = null;
                                        e.target.src = card.fallbackImage;
                                    }}
                                    style={{
                                        width: '100%',
                                        aspectRatio: '421 / 614',
                                        backgroundColor: '#121721',
                                        borderRadius: '4px',
                                        objectFit: 'cover'
                                    }} 
                                />
                            </OverlayTrigger>

                            {/* Delete Button */}
                            <Button onClick={() => onDeleteCard(card.id)} variant="outline-danger" size="sm" className="md-btn-delete w-100 mt-2">
                                Delete
                            </Button>
                            
                            {/* Add Button */}
                            <div className="d-flex flex-column gap-1 mt-1">
                                <Button onClick={() => {
                                    const extraDeckFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];
                                    const isExtraDeck = extraDeckFrames.includes(card.frameType?.toLowerCase());
                                    onAddCard({ ...card, isExtraDeck });
                                }} variant="outline-success" size="sm" className="md-btn-add w-100">
                                    Add
                                </Button>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}