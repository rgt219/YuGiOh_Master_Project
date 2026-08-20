'use client'; 

import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, InputGroup, Card, Badge, Spinner, Button } from 'react-bootstrap';
import Link from 'next/link';
import { getFannedCards } from '@/utils/communityDeckHelpers';
import '@/mdstyles.css';

export default function CommunityDecks({ mdSound }) {
    const [decks, setDecks] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedFormat, setSelectedFormat] = useState('ALL');
    const [sortBy, setSortBy] = useState('NEWEST');

    useEffect(() => {
        const fetchDecks = async () => {
            try {
                const res = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb`);
                if (!res.ok) throw new Error("FAILED_TO_LOAD_COMMUNITY_ARCHIVE");
                const data = await res.json();
                setDecks(Array.isArray(data) ? data : []);
            } catch (err) {
                console.error("COMMUNITY_ARCHIVE_FETCH_ERROR:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchDecks();
    }, []);

    // Filter & Sort Logic
    const filteredDecks = decks.filter(deck => {
        const titleMatch = (deck.title || deck.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const formatMatch = selectedFormat === 'ALL' || (deck.format || 'TCG').toUpperCase() === selectedFormat;
        return titleMatch && formatMatch;
    }).sort((a, b) => {
        if (sortBy === 'NEWEST') {
            return new Date(b.createdAt || b.CreatedAt || 0) - new Date(a.createdAt || a.CreatedAt || 0);
        }
        if (sortBy === 'CARDS') {
            return ((b.mainDeck?.length || 0) + (b.extraDeck?.length || 0)) - ((a.mainDeck?.length || 0) + (a.extraDeck?.length || 0));
        }
        return 0;
    });

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5" style={{ fontFamily: "'Cascadia Mono', monospace" }}>
            
            <style>{`
                .cascadia-font { font-family: 'Cascadia Mono', monospace !important; }
                .ygo-deck-card {
                    transition: all 0.35s cubic-bezier(0.175, 0.885, 0.32, 1.275) !important;
                    transform-style: preserve-3d;
                }
                .ygo-deck-card:hover {
                    transform: translateY(-6px) scale(1.015);
                    box-shadow: 0 12px 30px rgba(0, 242, 255, 0.18) !important;
                    border-color: #00f2ff !important;
                }
                .fanned-container { perspective: 1000px; }
                .card-left, .card-center, .card-right {
                    position: absolute;
                    transition: all 0.45s cubic-bezier(0.25, 0.8, 0.25, 1);
                    transform-origin: bottom center;
                    border-radius: 4px;
                }
                .card-left { transform: translateX(-15px) rotate(-6deg) scale(0.9); z-index: 1; opacity: 0.65; filter: brightness(0.6) blur(0.5px); }
                .card-right { transform: translateX(15px) rotate(6deg) scale(0.9); z-index: 2; opacity: 0.65; filter: brightness(0.6) blur(0.5px); }
                .card-center { transform: translateY(0) scale(1); z-index: 3; box-shadow: 0 8px 18px rgba(0,0,0,0.85); }
                
                .ygo-deck-card:hover .card-left { transform: translateX(-68px) translateY(-10px) rotate(-18deg) scale(0.95); opacity: 1; filter: brightness(0.95) blur(0); box-shadow: -8px 12px 20px rgba(0,0,0,0.6); }
                .ygo-deck-card:hover .card-right { transform: translateX(68px) translateY(-10px) rotate(18deg) scale(0.95); opacity: 1; filter: brightness(0.95) blur(0); box-shadow: 8px 12px 20px rgba(0,0,0,0.6); }
                .ygo-deck-card:hover .card-center { transform: translateY(-20px) scale(1.15); z-index: 4; filter: brightness(1.1); box-shadow: 0 15px 35px rgba(0, 242, 255, 0.5); }
                
                .holo-glow {
                    position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%);
                    width: 0px; height: 0px; background: radial-gradient(circle, rgba(0, 242, 255, 0.35) 0%, rgba(0, 0, 0, 0) 70%);
                    border-radius: 50%; transition: all 0.5s ease; z-index: 0; opacity: 0;
                }
                .ygo-deck-card:hover .holo-glow { width: 250px; height: 250px; opacity: 1; }
            `}</style>

            <Container>
                {/* HEADER TITLE */}
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h2 className="text-info m-0 cascadia-font fw-bold" style={{ letterSpacing: '1px' }}>PUBLIC COMMUNITY ARCHIVE</h2>
                            <p className="text-white-50 m-0 small cascadia-font">ACCESSING PUBLIC DECK ARCHIVES // INDEXED_TOTAL: [{decks.length}]</p>
                        </div>
                        <Button as={Link} href="/deckbuilder" variant="info" className="cascadia-font fw-bold text-dark px-3 py-2" onMouseEnter={() => mdSound?.playHover?.()} onClick={() => mdSound?.playClick?.()}>
                            CREATE NEW DECK
                        </Button>
                    </div>
                </Card>

                {/* FILTER TOOLBAR */}
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="shadow-lg p-3 mb-4 md-panel border-secondary">
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text className="bg-dark text-info border-secondary cascadia-font">🔍</InputGroup.Text>
                                <Form.Control type="text" placeholder="SEARCH_ARCHETYPE_OR_TITLE..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="bg-dark text-white border-secondary cascadia-font" />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={selectedFormat} onChange={(e) => setSelectedFormat(e.target.value)} className="bg-dark text-info border-secondary cascadia-font fw-bold">
                                <option value="ALL">ALL FORMATS</option>
                                <option value="TCG">TCG (GLOBAL)</option>
                                <option value="MASTERDUEL">MASTER DUEL</option>
                                <option value="OCG">OCG (ASIA)</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="bg-dark text-info border-secondary cascadia-font fw-bold">
                                <option value="NEWEST">SORT: RECENTLY ADDED</option>
                                <option value="CARDS">SORT: DECK SIZE</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </Card>

                {/* LOADING SPINNER */}
                {loading && (
                    <div className="d-flex justify-content-center align-items-center mt-5">
                        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '30rem' }} className="border-info p-4 text-center md-panel shadow-lg">
                            <Card.Body>
                                <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                                <h5 className="text-info cascadia-font fw-bold m-0" style={{ letterSpacing: '1px' }}>FETCHING_COMMUNITY_DECKS...</h5>
                            </Card.Body>
                        </Card>
                    </div>
                )}

                {/* DECK GRID */}
                {!loading && filteredDecks.length === 0 && (
                    <div className="text-center py-5 text-white-50 cascadia-font">
                        <h5>NO_PUBLIC_DECKS_FOUND_MATCHING_CRITERIA</h5>
                    </div>
                )}

                {!loading && filteredDecks.length > 0 && (
                    <Row xs={1} md={2} lg={3} className="g-4">
                        {filteredDecks.map((deck, idx) => {
                            const deckId = deck?.id || deck?._id || idx;
                            const archetype = deck?.title || deck?.name || 'UNNAMED_DECK';
                            const mainDeck = deck?.mainDeck || [];
                            const extraDeck = deck?.extraDeck || [];
                            const sideDeck = deck?.sideDeck || [];
                            const author = deck?.authorName || deck?.author || deck?.username || deck?.userName || deck?.user || deck?.userId || 'ANONYMOUS';

                            const fannedCardIds = getFannedCards(mainDeck, extraDeck, sideDeck);

                            return (
                                <Col key={deckId}>
                                    <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-info border-opacity-50 shadow h-100 md-panel ygo-deck-card d-flex flex-column">
                                        <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 px-3 py-3">
                                            <div className="d-flex flex-column gap-2">
                                                <h5 className="m-0 fw-bold text-white cascadia-font" style={{ fontSize: '1.25rem', display: '-webkit-box', WebkitLineClamp: '2', WebkitBoxOrient: 'vertical', overflow: 'hidden', lineHeight: '1.2' }} title={archetype}>
                                                    {archetype}
                                                </h5>
                                                <div className="d-flex align-items-center">
                                                    <Badge bg="dark" className="text-light fw-bold px-2 py-1 cascadia-font border border-secondary border-opacity-50" style={{ fontSize: '0.8rem' }}>
                                                        FORMAT: {deck?.format || 'TCG'}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </Card.Header>

                                        <Card.Body className="d-flex flex-column justify-content-between p-3">
                                            <div>
                                                <div className="my-3 d-flex justify-content-center align-items-center position-relative fanned-container" style={{ height: '220px', width: '100%' }}>
                                                    <div className="holo-glow"></div>
                                                    
                                                    <img src={`https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images/${fannedCardIds[0]}.jpg`} alt="Card 1" className="border border-info border-opacity-25 card-left" style={{ height: '170px', objectFit: 'contain' }} onError={(e) => { e.target.src = `https://images.ygoprodeck.com/images/cards/${fannedCardIds[0]}.jpg`; }} />
                                                    <img src={`https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images/${fannedCardIds[2]}.jpg`} alt="Card 3" className="border border-info border-opacity-25 card-right" style={{ height: '170px', objectFit: 'contain' }} onError={(e) => { e.target.src = `https://images.ygoprodeck.com/images/cards/${fannedCardIds[2]}.jpg`; }} />
                                                    <img src={`https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images/${fannedCardIds[1]}.jpg`} alt="Card 2" className="border border-info card-center" style={{ height: '185px', objectFit: 'contain' }} onError={(e) => { e.target.src = `https://images.ygoprodeck.com/images/cards/${fannedCardIds[1]}.jpg`; }} />
                                                </div>

                                                <div className="d-flex align-items-center mb-2">
                                                    <span className="badge bg-dark border border-success text-warning px-2 py-1 cascadia-font text-truncate" style={{ fontSize: '0.85rem', maxWidth: '100%' }}>
                                                        AUTHOR: {author}
                                                    </span>
                                                </div>

                                                <div className="p-2.5 rounded mb-2" style={{ backgroundColor: 'rgba(0, 0, 0, 0.65)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                                    <h6 className="text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-1.5 cascadia-font" style={{ fontSize: '0.85rem', letterSpacing: '1px' }}>DECK BREAKDOWN</h6>
                                                    <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                        <span className="text-white-50">MAIN DECK:</span>
                                                        <strong className="text-info">{mainDeck.length} CARDS</strong>
                                                    </div>
                                                    <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                        <span className="text-white-50">EXTRA DECK:</span>
                                                        <strong className="text-warning">{extraDeck.length} CARDS</strong>
                                                    </div>
                                                    <div className="d-flex justify-content-between text-white cascadia-font" style={{ fontSize: '0.85rem', lineHeight: '1.4' }}>
                                                        <span className="text-white-50">SIDE DECK:</span>
                                                        <strong className="text-success">{sideDeck.length} CARDS</strong>
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="pt-2 border-top border-secondary border-opacity-25 mt-1">
                                                <div className="d-flex align-items-center justify-content-between mb-1.5">
                                                    <span className="small text-white-50 cascadia-font" style={{ fontSize: '0.75rem' }}>CREATED:</span>
                                                    <span className="small text-info cascadia-font" style={{ fontSize: '0.8rem' }}>
                                                        {(deck?.createdAt || deck?.CreatedAt) ? new Date(deck.createdAt || deck.CreatedAt).toLocaleDateString(undefined, { year: 'numeric', month: 'short', day: 'numeric' }) : 'RECENTLY'}
                                                    </span>
                                                </div>

                                                <Button as={Link} href={`/deckprofiledetails/${deckId}`} variant="outline-info" className="w-100 fw-bold cascadia-font text-nowrap py-1.5 mt-1" style={{ fontSize: '0.9rem', letterSpacing: '0.5px' }} onMouseEnter={() => mdSound?.playHover?.()} onClick={() => mdSound?.playClick?.()}>
                                                    VIEW DECK ➔
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            );
                        })}
                    </Row>
                )}
            </Container>
        </div>
    );
}