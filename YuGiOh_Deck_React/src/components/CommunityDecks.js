import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Form, InputGroup, Card, Badge, Spinner, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../mdstyles.css';

// 🚀 YOUR AZURE BLOB STORAGE CONTAINER
const AZURE_BLOB_BASE_URL = "https://ygocardstore.blob.core.windows.net/card-images";

export default function CommunityDecks() {
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

    // 🚀 Robust Helper: Safely extract Card ID regardless of MongoDB serialization format
    const getPreviewCardId = (deck) => {
        const previewCard = deck.mainDeck?.[0] || deck.extraDeck?.[0] || deck.sideDeck?.[0];
        if (!previewCard) return null;

        // If previewCard is an object
        if (typeof previewCard === 'object' && previewCard !== null) {
            return previewCard.id || previewCard.Id || previewCard.cardId || previewCard._id || null;
        }

        // If previewCard is stored directly as a primitive number or string ID
        if (typeof previewCard === 'number' || typeof previewCard === 'string') {
            return previewCard;
        }

        return null;
    };

    // Filter & Sort Logic
    const filteredDecks = decks.filter(deck => {
        const titleMatch = (deck.title || deck.name || '').toLowerCase().includes(searchTerm.toLowerCase());
        const formatMatch = selectedFormat === 'ALL' || (deck.format || 'TCG').toUpperCase() === selectedFormat;
        return titleMatch && formatMatch;
    }).sort((a, b) => {
        if (sortBy === 'NEWEST') {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        }
        if (sortBy === 'CARDS') {
            return ((b.mainDeck?.length || 0) + (b.extraDeck?.length || 0)) - ((a.mainDeck?.length || 0) + (a.extraDeck?.length || 0));
        }
        return 0;
    });

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5">
            <Container>
                {/* HEADER TITLE */}
                <div className="md-panel p-4 mb-4 border-info">
                    <div className="d-flex justify-content-between align-items-center flex-wrap gap-2">
                        <div>
                            <h2 className="text-info m-0 terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
                                PUBLIC COMMUNITY ARCHIVE
                            </h2>
                            <p className="text-muted m-0 small terminal-font">
                                ACCESSING PUBLIC DECK ARCHIVES // INDEXED_TOTAL: [{decks.length}]
                            </p>
                        </div>
                        <Button as={Link} to="/deckbuilder" variant="info" className="terminal-font fw-bold text-dark px-3 py-2">
                            CREATE NEW DECK
                        </Button>
                    </div>
                </div>

                {/* FILTER TOOLBAR */}
                <div className="md-panel p-3 mb-4 border-secondary">
                    <Row className="g-3">
                        <Col md={6}>
                            <InputGroup>
                                <InputGroup.Text className="bg-dark text-info border-secondary terminal-font">🔍</InputGroup.Text>
                                <Form.Control
                                    type="text"
                                    placeholder="SEARCH_ARCHETYPE_OR_TITLE..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="bg-dark text-white border-secondary terminal-font"
                                />
                            </InputGroup>
                        </Col>
                        <Col md={3}>
                            <Form.Select 
                                value={selectedFormat}
                                onChange={(e) => setSelectedFormat(e.target.value)}
                                className="bg-dark text-info border-secondary terminal-font"
                            >
                                <option value="ALL">ALL FORMATS</option>
                                <option value="TCG">TCG (GLOBAL)</option>
                                <option value="MASTERDUEL">MASTER DUEL</option>
                                <option value="OCG">OCG (ASIA)</option>
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Select 
                                value={sortBy}
                                onChange={(e) => setSortBy(e.target.value)}
                                className="bg-dark text-info border-secondary terminal-font"
                            >
                                <option value="NEWEST">SORT: RECENTLY ADDED</option>
                                <option value="CARDS">SORT: DECK SIZE</option>
                            </Form.Select>
                        </Col>
                    </Row>
                </div>

                {/* LOADING SPINNER */}
                {loading && (
                    <div className="text-center py-5">
                        <Spinner animation="border" variant="info" className="mb-3" />
                        <h5 className="text-info terminal-font">FETCHING_COMMUNITY_DECKS...</h5>
                    </div>
                )}

                {/* DECK GRID */}
                {!loading && filteredDecks.length === 0 && (
                    <div className="md-panel p-5 text-center text-muted terminal-font">
                        NO_PUBLIC_DECKS_FOUND_MATCHING_CRITERIA
                    </div>
                )}

                {!loading && filteredDecks.length > 0 && (
                    <Row className="g-4">
                        {filteredDecks.map((d, idx) => {
                            const mainCount = d.mainDeck?.length || 0;
                            const extraCount = d.extraDeck?.length || 0;
                            
                            // 1. Safely extract ID using our new helper
                            const cardId = getPreviewCardId(d);

                            // 2. Primary: Azure Blob CDN URL
                            const previewImg = cardId ? `${AZURE_BLOB_BASE_URL}/${cardId}.jpg` : null;

                            // 3. Fallback: YGOProDeck CDN
                            const fallbackImg = cardId ? `https://images.ygoprodeck.com/images/cards/${cardId}.jpg` : null;

                            return (
                                <Col key={d.id || d._id || idx} lg={4} md={6}>
                                    <Card className="bg-black border-info border-opacity-30 md-panel h-100 p-3 hover-glow">
                                        <div className="d-flex gap-3 align-items-center mb-3">
                                            {previewImg ? (
                                                <img 
                                                    src={previewImg} 
                                                    alt={d.title || "Deck Preview"} 
                                                    style={{ width: '60px', height: '88px', borderRadius: '4px', objectFit: 'cover' }} 
                                                    /* 🛡️ Fallback to YGOProDeck CDN if Azure Blob fails or 404s */
                                                    onError={(e) => {
                                                        if (fallbackImg && e.target.src !== fallbackImg) {
                                                            e.target.src = fallbackImg;
                                                        } else {
                                                            // If both images fail, show placeholder div instead of broken image
                                                            e.target.style.display = 'none';
                                                        }
                                                    }}
                                                />
                                            ) : (
                                                <div 
                                                    className="bg-dark border border-secondary rounded d-flex align-items-center justify-content-center text-muted terminal-font"
                                                    style={{ width: '60px', height: '88px', fontSize: '0.7rem' }}
                                                >
                                                    NO_ART
                                                </div>
                                            )}
                                            <div className="flex-grow-1 overflow-hidden">
                                                <Badge bg="dark" className="border border-info text-info terminal-font mb-1">
                                                    {d.format || 'TCG'}
                                                </Badge>
                                                <h5 className="text-white terminal-font fw-bold text-truncate m-0">
                                                    {d.title || d.name || 'UNNAMED_DECK'}
                                                </h5>
                                                <small className="terminal-font d-block mt-1">
                                                    AUTHOR: {d.userId || d.user || 'ANONYMOUS'}
                                                </small>
                                            </div>
                                        </div>

                                        <div className="d-flex justify-content-between align-items-center pt-2 border-top border-secondary border-opacity-40 mt-auto">
                                            <div className="small terminal-font">
                                                <span className="text-info me-2">MAIN: {mainCount}</span>
                                                <span className="text-warning">EXTRA: {extraCount}</span>
                                            </div>

                                            <Button 
                                                as={Link} 
                                                to={`/deckprofiledetails/${d.id || d._id}`} 
                                                variant="outline-info" 
                                                size="sm"
                                                className="terminal-font fw-bold"
                                            >
                                                VIEW DECK ➔
                                            </Button>
                                        </div>
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