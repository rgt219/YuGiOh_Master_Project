import React, { useState, useMemo } from 'react';
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, OverlayTrigger, Container, Row, Col, Form, Card, Spinner, Badge, Tooltip } from 'react-bootstrap';
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

// Helper for Attribute badge colors
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
        fallbackImage: card.card_images[0].image_url
    }));
};

export default function CardApi({ onAddCard, onDeleteCard, cardList }) {
    // 2. React Query caches the entire catalog in RAM
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

    if (queryLoading) return (
        <div className="text-center p-5">
            <Spinner animation="border" variant="info" />
            <div className="text-info mt-2 terminal-font">ACCESSING_MASTER_DATABASE...</div>
        </div>
    );

    if (isError) return <div className="text-danger p-5 terminal-font">ERROR: DATABASE_OFFLINE</div>;

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
                                    /* 🚀 MASTER DUEL STYLE HOVER CARD TOOLTIP */
                                    <Card 
                                        style={{ width: '50rem', backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} 
                                        text="white" 
                                        className="border-info shadow-lg p-3"
                                    >
                                        <Card.Body>
                                            {hoveredCardData && String(hoveredCardData.id) === String(card.id) ? (
                                                /* Use a Row to split the image and details */
                                                <div className="row">
                                                    {/* --- Card Image (Left Side) --- */}
                                                    <div className="col-md-5 text-center d-flex align-items-center justify-content-center">
                                                        <img 
                                                            src={hoveredCardData.image}
                                                            alt={hoveredCardData.name}
                                                            onError={(e) => { e.target.onerror = null; e.target.src = card.fallbackImage; }}
                                                            className="img-fluid rounded mb-3"
                                                            style={{
                                                                maxHeight: '400px',
                                                                boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' // Subtle cyan glow
                                                            }}
                                                        />
                                                    </div>

                                                    {/* --- Card Details (Right Side) --- */}
                                                    <div className="col-md-7">
                                                        <h5 className="fw-bold mb-3 text-white" style={{ fontFamily: "Cascadia Mono, monospace", letterSpacing: '1px' }}>
                                                            {hoveredCardData.name}
                                                        </h5>

                                                        {/* Badges Row */}
                                                        <div className="d-flex align-items-center mb-2 flex-wrap gap-1">
                                                            <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                                                {hoveredCardData.type}
                                                            </Badge>
                                                            {hoveredCardData.race && (
                                                                <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                                                    {hoveredCardData.race}
                                                                </Badge>
                                                            )}
                                                            {hoveredCardData.attribute && (
                                                                <Badge bg={getAttributeColor(hoveredCardData.attribute)} className="ms-auto text-uppercase fs-7 fw-bold">
                                                                    {hoveredCardData.attribute}
                                                                  </Badge>
                                                              )}
                                                            </div>

                                                            {/* Level / Rank Stars */}
                                                            {hoveredCardData.level && (
                                                                <div className="mb-2 text-start">
                                                                  <span className="small text-white-50 fw-bold me-2">Level / Rank:</span>
                                                                  <span className="text-info fw-bold">{hoveredCardData.level} ★</span>
                                                                </div>
                                                            )}

                                                            {/* ATK / DEF Stat Bar */}
                                                            {typeof hoveredCardData.atk === 'number' && (
                                                                <div className="d-flex align-items-center px-3 py-1 mb-3 rounded" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                                                  <span className="small text-white-50 fw-bold me-2">ATK /</span>
                                                                  <span className="text-white fw-bold me-4">{hoveredCardData.atk}</span>
                                                                  
                                                                  <span className="small text-white-50 fw-bold me-2">DEF /</span>
                                                                  <span className="text-white fw-bold">{hoveredCardData.def ?? '-'}</span>
                                                                </div>
                                                            )}

                                                            {/* Card Effect Text Box */}
                                                            <div className="text-start p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                                                <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-2">
                                                                    Card Effect / Text
                                                                </h6>
                                                                <p className="text-white-50 m-0" style={{ fontSize: '0.85rem', lineHeight: '1.4', maxHeight: '180px', overflowY: 'auto' }}>
                                                                    {hoveredCardData.desc}
                                                                </p>
                                                            </div>
                                                        </div>
                                                    </div>
                                            ) : (
                                                <div className="text-center p-3">
                                                    <span className="text-info terminal-font">LOADING_DATA...</span>
                                                </div>
                                            )}
                                        </Card.Body>
                                    </Card>
                                }
                            >
                                {/* Optimized Card Image */}
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