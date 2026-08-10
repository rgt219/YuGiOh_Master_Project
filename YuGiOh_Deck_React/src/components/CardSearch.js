'use client'; // 👈 Required for client state, search inputs, pagination, and modals

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Form, Button, Badge, Spinner, Modal, Row, Col, InputGroup } from 'react-bootstrap';

// ⚡ Azure Blob Storage Container URL for card images
const AZURE_BLOB_CONTAINER_URL = "https://yugiohforumstorage.blob.core.windows.net/forum-media";
const CARDS_PER_PAGE = 30; // Paginate by 30 cards per page

// Search Filter Option Lists
const ATTRIBUTES = ['ALL', 'DARK', 'LIGHT', 'EARTH', 'WATER', 'FIRE', 'WIND', 'DIVINE'];
const MAIN_CARD_TYPES = ['ALL', 'MONSTER', 'SPELL', 'TRAP'];
const MONSTER_ABILITIES = ['ALL', 'FLIP', 'TUNER', 'GEMINI', 'SPIRIT', 'UNION', 'PENDULUM'];

// Category-Specific Subtype Lists
const MONSTER_RACES = [
    'ALL MONSTER TYPES',
    'Aqua', 'Beast', 'Beast-Warrior', 'Cyberse', 'Dinosaur', 'Divine-Beast', 
    'Dragon', 'Fairy', 'Fiend', 'Fish', 'Illusion', 'Insect', 'Machine', 
    'Psychic', 'Pyro', 'Reptile', 'Rock', 'Sea Serpent', 'Spellcaster', 
    'Thunder', 'Warrior', 'Winged Beast', 'Wyrm', 'Zombie'
];

const SPELL_TYPES = [
    'ALL SPELL TYPES', 
    'Normal', 'Field', 'Equip', 'Quick-Play', 'Continuous', 'Ritual'
];

const TRAP_TYPES = [
    'ALL TRAP TYPES', 
    'Normal', 'Continuous', 'Counter'
];

// Deduplicated master list for "ALL" categories
const ALL_RACES_TYPES = [
    'ALL RACES / TYPES',
    ...Array.from(new Set([
        ...MONSTER_RACES.slice(1), 
        ...SPELL_TYPES.slice(1), 
        ...TRAP_TYPES.slice(1)
    ])).sort()
];

// Helper to render Level / Rank stars
const renderLevelStars = (level) => {
    if (!level) return null;
    return (
        <div className="d-flex align-items-center gap-1">
            <span className="text-warning fw-bold small">LEVEL / RANK {level}</span>
            <span className="text-warning">{"★".repeat(Math.min(level, 12))}</span>
        </div>
    );
};

// Helper to render color-coded Banlist Status badges
const renderBanBadge = (status) => {
    const s = (status || "Unlimited").toUpperCase();
    if (s === "FORBIDDEN" || s === "BANNED") return <Badge bg="danger" className="terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>FORBIDDEN</Badge>;
    if (s === "LIMITED") return <Badge bg="warning" className="text-dark terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>LIMITED</Badge>;
    if (s === "SEMI-LIMITED") return <Badge bg="info" className="text-dark terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>SEMI-LIMITED</Badge>;
    return <Badge bg="success" className="terminal-font shadow-sm px-2 py-1" style={{ fontSize: '0.65rem', letterSpacing: '0.5px' }}>UNLIMITED</Badge>;
};

export default function CardSearch() {
    const [rawCards, setRawCards] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    // Search Criteria State
    const [searchQuery, setSearchQuery] = useState("Dragon");
    const [selectedMainType, setSelectedMainType] = useState("ALL");
    const [selectedAttribute, setSelectedAttribute] = useState("ALL");
    const [selectedAbility, setSelectedAbility] = useState("ALL");
    const [selectedRace, setSelectedRace] = useState("ALL RACES / TYPES");

    // Pagination State
    const [currentPage, setCurrentPage] = useState(1);

    // Inspect Modal State
    const [inspectCard, setInspectCard] = useState(null);

    // ⚡ Dynamically compute dropdown options based on selected main category
    const currentRaceOptions = useMemo(() => {
        if (selectedMainType === "SPELL") return SPELL_TYPES;
        if (selectedMainType === "TRAP") return TRAP_TYPES;
        if (selectedMainType === "MONSTER") return MONSTER_RACES;
        return ALL_RACES_TYPES;
    }, [selectedMainType]);

    // ⚡ Handle Category switch & reset race filter to default option
    const handleCategoryChange = (newCategory) => {
        setSelectedMainType(newCategory);
        if (newCategory === "SPELL") setSelectedRace("ALL SPELL TYPES");
        else if (newCategory === "TRAP") setSelectedRace("ALL TRAP TYPES");
        else if (newCategory === "MONSTER") setSelectedRace("ALL MONSTER TYPES");
        else setSelectedRace("ALL RACES / TYPES");
    };

    // ⚡ Query YGOProDeck API (with misc=yes for pricing & banlists)
    const fetchCards = useCallback(async () => {
        setIsLoading(true);
        setHasError(false);

        try {
            const params = new URLSearchParams();
            params.append("misc", "yes");
            
            if (selectedAttribute !== "ALL") params.append("attribute", selectedAttribute.toLowerCase());
            
            if (selectedRace && !selectedRace.startsWith("ALL")) {
                params.append("race", selectedRace);
            }
            
            if (selectedMainType === "SPELL") params.append("type", "Spell Card");
            else if (selectedMainType === "TRAP") params.append("type", "Trap Card");

            const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?${params.toString()}`;
            const response = await fetch(url);

            if (response.ok) {
                const result = await response.json();
                
                const normalized = (result.data || []).map(c => {
                    const priceObj = c.card_prices?.[0] || {};
                    const banObj = c.banlist_info || {};
                    const miscObj = c.misc_info?.[0] || {};

                    const isLinkOrPendulum = (c.type || "").toLowerCase().includes("link") || 
                                             (c.type || "").toLowerCase().includes("pendulum");

                    const genesysPts = isLinkOrPendulum ? "N/A" : (miscObj.genesys_points ?? 0);

                    return {
                        id: c.id,
                        name: c.name || "Unknown Card",
                        type: c.type || "Normal",
                        desc: c.desc || "No card text available.",
                        level: c.level || c.rank || c.linkval || null,
                        atk: c.atk ?? null,
                        def: c.def ?? null,
                        race: c.race || "",
                        attribute: c.attribute || "",
                        image: `${AZURE_BLOB_CONTAINER_URL}/${c.id}.jpg`,
                        fallbackImage: c.card_images?.[0]?.image_url || "",
                        
                        prices: {
                            tcgplayer: priceObj.tcgplayer_price ? `$${priceObj.tcgplayer_price}` : "N/A",
                            cardmarket: priceObj.cardmarket_price ? `€${priceObj.cardmarket_price}` : "N/A",
                            ebay: priceObj.ebay_price ? `$${priceObj.ebay_price}` : "N/A"
                        },

                        banlist: {
                            masterduel: banObj.ban_masterduel || "Unlimited",
                            tcg: banObj.ban_tcg || "Unlimited",
                            ocg: banObj.ban_ocg || "Unlimited"
                        },

                        isLinkOrPendulum,
                        genesysPoints: genesysPts
                    };
                });

                setRawCards(normalized);
            } else if (response.status === 400 || response.status === 404) {
                setRawCards([]);
            } else {
                setHasError(true);
            }
        } catch (err) {
            console.error("Error querying card database:", err);
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [selectedMainType, selectedAttribute, selectedRace]);

    useEffect(() => {
        const timer = setTimeout(() => {
            fetchCards();
        }, 300);
        return () => clearTimeout(timer);
    }, [fetchCards]);

    // ⚡ MULTI-CRITERIA FILTERING
    const filteredCards = useMemo(() => {
        const queryLower = searchQuery.trim().toLowerCase();

        return rawCards.filter(card => {
            const matchesText = !queryLower || 
                card.name.toLowerCase().includes(queryLower) ||
                card.desc.toLowerCase().includes(queryLower) ||
                card.id.toString().includes(queryLower);

            let matchesMainType = true;
            if (selectedMainType === "MONSTER") matchesMainType = card.type.toLowerCase().includes("monster");
            else if (selectedMainType === "SPELL") matchesMainType = card.type.toLowerCase().includes("spell");
            else if (selectedMainType === "TRAP") matchesMainType = card.type.toLowerCase().includes("trap");

            let matchesAbility = true;
            if (selectedAbility !== "ALL") {
                matchesAbility = card.type.toLowerCase().includes(selectedAbility.toLowerCase());
            }

            let matchesRace = true;
            if (selectedRace && !selectedRace.startsWith("ALL")) {
                matchesRace = card.race.toLowerCase() === selectedRace.toLowerCase();
            }

            return matchesText && matchesMainType && matchesAbility && matchesRace;
        });
    }, [rawCards, searchQuery, selectedMainType, selectedAbility, selectedRace]);

    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, selectedMainType, selectedAttribute, selectedAbility, selectedRace]);

    const totalPages = Math.ceil(filteredCards.length / CARDS_PER_PAGE) || 1;

    const paginatedCards = useMemo(() => {
        const startIndex = (currentPage - 1) * CARDS_PER_PAGE;
        return filteredCards.slice(startIndex, startIndex + CARDS_PER_PAGE);
    }, [filteredCards, currentPage]);

    return (
        <div className="md-theme-bg min-vh-100 text-white" style={{ paddingTop: '95px', paddingBottom: '60px', backgroundColor: '#0a0d14' }}>
            <style>{`
                .terminal-font { font-family: 'Courier New', Courier, monospace; }
                .hud-label { letter-spacing: 1px; }
                .attr-DARK { background-color: #0d6efd; color: #fff; }
                .attr-LIGHT { background-color: #bfa136; color: #fff; }
                .attr-EARTH { background-color: #7a5127; color: #fff; }
                .attr-WATER { background-color: #2672b8; color: #fff; }
                .attr-FIRE { background-color: #b83326; color: #fff; }
                .attr-WIND { background-color: #28804a; color: #fff; }
                .attr-DIVINE { background-color: #c98018; color: #fff; }
                .vrains-corner { position: absolute; width: 8px; height: 8px; border-color: #00d2ff; border-style: solid; }
                .vrains-corner-tl { top: 0; left: 0; border-width: 2px 0 0 2px; }
                .vrains-corner-tr { top: 0; right: 0; border-width: 2px 2px 0 0; }
                .vrains-corner-bl { bottom: 0; left: 0; border-width: 0 0 2px 2px; }
                .vrains-corner-br { bottom: 0; right: 0; border-width: 0 2px 2px 0; }
                .vrains-stat-box { background: rgba(0,0,0,0.6); border: 1px solid rgba(0,210,255,0.3); border-radius: 4px; text-align: center; }
                .md-card-tile { border: 1px solid #1e2638; transition: transform 0.2s, border-color 0.2s; cursor: pointer; }
                .md-card-tile:hover { transform: translateY(-4px); border-color: #00d2ff !important; box-shadow: 0 0 15px rgba(0,210,255,0.3); }
            `}</style>

            <div className="container-fluid px-4" style={{ maxWidth: '1400px' }}>
                
                {/* 🌐 VRAINS HEADER & CONTROL PANEL */}
                <div className="p-4 rounded-3 bg-dark border border-info border-opacity-25 shadow-lg mb-4" style={{ background: 'rgba(15, 23, 42, 0.9)' }}>
                    <div className="d-flex justify-content-between align-items-center mb-3">
                        <div>
                            <h3 className="fw-bold text-info terminal-font m-0 d-flex align-items-center gap-2">
                                CARD DATABASE
                            </h3>
                            <span className="text-white-50 small terminal-font">
                                FOUND {filteredCards.length} MATCHES • PAGE {currentPage} OF {totalPages}
                            </span>
                        </div>
                        <Badge bg="info" className="text-dark terminal-font fs-6 px-3 py-2">
                            POWERED BY AZURE BLOB STORAGE
                        </Badge>
                    </div>

                    <Row className="g-3">
                        <Col lg={4} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">
                                NAME OR EFFECT TEXT SEARCH
                            </Form.Label>
                            <InputGroup>
                                <Form.Control 
                                    type="text"
                                    placeholder="Search card name, 'negate', 'destroy'..."
                                    className="bg-black text-white border-secondary terminal-font"
                                    style={{ color: '#fff', backgroundColor: 'rgba(0,0,0,0.6)' }}
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                />
                                {searchQuery && (
                                    <Button 
                                        variant="outline-secondary" 
                                        onClick={() => setSearchQuery("")}
                                        className="terminal-font"
                                    >
                                        ✖
                                    </Button>
                                )}
                            </InputGroup>
                        </Col>

                        <Col lg={3} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">
                                CARD CATEGORY
                            </Form.Label>
                            <div className="d-flex gap-1">
                                {MAIN_CARD_TYPES.map(type => (
                                    <Button
                                        key={type}
                                        variant={selectedMainType === type ? "info" : "outline-secondary"}
                                        size="sm"
                                        className="terminal-font fw-bold flex-grow-1"
                                        onClick={() => handleCategoryChange(type)}
                                    >
                                        {type}
                                    </Button>
                                ))}
                            </div>
                        </Col>

                        <Col lg={2} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">
                                ABILITY / TYPE
                            </Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedAbility}
                                onChange={(e) => setSelectedAbility(e.target.value)}
                                disabled={selectedMainType === "SPELL" || selectedMainType === "TRAP"}
                            >
                                {MONSTER_ABILITIES.map(ability => (
                                    <option key={ability} value={ability}>
                                        {ability === 'ALL' ? 'ALL ABILITIES' : ability}
                                    </option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col lg={3} md={6}>
                            <Form.Label className="hud-label text-info small terminal-font mb-1">
                                {selectedMainType === "SPELL" ? "SPELL TYPE" : selectedMainType === "TRAP" ? "TRAP TYPE" : "MONSTER TYPE / RACE"}
                            </Form.Label>
                            <Form.Select 
                                className="bg-black text-info border-secondary terminal-font"
                                style={{ backgroundColor: 'rgba(0,0,0,0.6)' }}
                                value={selectedRace}
                                onChange={(e) => setSelectedRace(e.target.value)}
                            >
                                {currentRaceOptions.map(option => (
                                    <option key={option} value={option}>{option.toUpperCase()}</option>
                                ))}
                            </Form.Select>
                        </Col>

                        <Col lg={12} className="d-flex align-items-center gap-2 pt-2 border-top border-secondary border-opacity-25">
                            <span className="text-white-50 small terminal-font me-2">ATTRIBUTE:</span>
                            {ATTRIBUTES.map(attr => (
                                <Button
                                    key={attr}
                                    variant={selectedAttribute === attr ? "info" : "outline-dark"}
                                    size="sm"
                                    className={`terminal-font font-monospace text-uppercase px-3 ${selectedAttribute === attr ? 'text-dark fw-bold' : 'text-white-50'}`}
                                    onClick={() => setSelectedAttribute(attr)}
                                >
                                    {attr}
                                </Button>
                            ))}
                        </Col>

                    </Row>
                </div>

                {/* ⚡ TOP PAGINATION CONTROLS */}
                {totalPages > 1 && (
                    <div className="d-flex align-items-center justify-content-between my-3 p-2 bg-dark rounded border border-info border-opacity-10">
                        <span className="text-info terminal-font small fw-bold ms-2">
                            SHOWING {((currentPage - 1) * CARDS_PER_PAGE) + 1} - {Math.min(currentPage * CARDS_PER_PAGE, filteredCards.length)} OF {filteredCards.length} CARDS
                        </span>
                        <div className="d-flex align-items-center gap-2">
                            <Button 
                                variant="outline-info" 
                                size="sm" 
                                className="terminal-font fw-bold px-3"
                                disabled={currentPage === 1}
                                onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                            >
                                ◄ PREV
                            </Button>
                            <span className="text-white terminal-font small px-2">
                                PAGE {currentPage} / {totalPages}
                            </span>
                            <Button 
                                variant="outline-info" 
                                size="sm" 
                                className="terminal-font fw-bold px-3"
                                disabled={currentPage === totalPages}
                                onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                            >
                                NEXT ►
                            </Button>
                        </div>
                    </div>
                )}

                {/* 🎴 MASTER DUEL CARD GRID */}
                {isLoading ? (
                    <div className="text-center my-5 py-5">
                        <Spinner animation="border" variant="info" style={{ width: '3rem', height: '3rem' }} />
                        <p className="text-info terminal-font mt-3">DECRYPTING_VRAINS_DATABASE...</p>
                    </div>
                ) : hasError ? (
                    <div className="p-5 text-center bg-dark rounded-3 border border-danger border-opacity-50 my-4">
                        <h4 className="text-danger terminal-font">⚠️ API_CONNECTION_ERROR</h4>
                        <p className="text-white-50 small mb-3">Unable to fetch card data from server.</p>
                        <Button variant="outline-info" size="sm" className="terminal-font" onClick={fetchCards}>
                            RETRY_SEARCH
                        </Button>
                    </div>
                ) : filteredCards.length === 0 ? (
                    <div className="p-5 text-center bg-dark rounded-3 border border-secondary border-opacity-25 my-4">
                        <h4 className="text-white-50 terminal-font">NO CARDS MATCH CURRENT FILTER CRITERIA</h4>
                        <p className="text-white-50 small mb-3">Try clearing search terms or broadening monster types.</p>
                        <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="terminal-font"
                            onClick={() => {
                                setSearchQuery("");
                                handleCategoryChange("ALL");
                                setSelectedAttribute("ALL");
                                setSelectedAbility("ALL");
                            }}
                        >
                            RESET_ALL_FILTERS
                        </Button>
                    </div>
                ) : (
                    <Row className="g-3 row-cols-2 row-cols-sm-3 row-cols-md-4 row-cols-lg-6 row-cols-xl-6">
                        {paginatedCards.map(card => (
                            <Col key={card.id}>
                                <div 
                                    className="md-card-tile p-2 rounded-3 bg-dark h-100 d-flex flex-column justify-content-between position-relative"
                                    onClick={() => setInspectCard(card)}
                                >
                                    <div className="position-relative overflow-hidden rounded mb-2">
                                        <img 
                                            src={card.image} 
                                            alt={card.name} 
                                            className="w-100 h-auto rounded"
                                            loading="lazy"
                                            onError={(e) => {
                                                if (e.target.src !== card.fallbackImage && card.fallbackImage) {
                                                    e.target.src = card.fallbackImage;
                                                } else {
                                                    e.target.src = "https://ygoprodeck.com/images/cards/back.jpg";
                                                }
                                            }}
                                        />
                                        {card.attribute && (
                                            <span 
                                                className={`position-absolute top-0 end-0 badge attr-${card.attribute.toUpperCase()} m-1 font-monospace`}
                                                style={{ fontSize: '0.6rem' }}
                                            >
                                                {card.attribute.toUpperCase()}
                                            </span>
                                        )}
                                    </div>

                                    <div className="text-center">
                                        <span className="text-white fw-bold d-block text-truncate small" title={card.name}>
                                            {card.name}
                                        </span>
                                        <span className="text-info-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>
                                            ID: #{card.id}
                                        </span>
                                    </div>
                                </div>
                            </Col>
                        ))}
                    </Row>
                )}

                {/* ⚡ BOTTOM PAGINATION CONTROLS */}
                {totalPages > 1 && (
                    <div className="d-flex align-items-center justify-content-center gap-3 mt-4 pt-3 border-top border-secondary border-opacity-25">
                        <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="terminal-font fw-bold px-4"
                            disabled={currentPage === 1}
                            onClick={() => {
                                setCurrentPage(prev => Math.max(prev - 1, 1));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            ◄ PREVIOUS_PAGE
                        </Button>

                        <span className="text-info terminal-font small fw-bold px-2">
                            PAGE {currentPage} OF {totalPages}
                        </span>

                        <Button 
                            variant="outline-info" 
                            size="sm" 
                            className="terminal-font fw-bold px-4"
                            disabled={currentPage === totalPages}
                            onClick={() => {
                                setCurrentPage(prev => Math.min(prev + 1, totalPages));
                                window.scrollTo({ top: 0, behavior: 'smooth' });
                            }}
                        >
                            NEXT_PAGE ►
                        </Button>
                    </div>
                )}

            </div>

            {/* ⚡ REORGANIZED TIGHT VRAINS CYBER HUD INSPECT MODAL */}
            {inspectCard && (
                <Modal
                    show={!!inspectCard}
                    onHide={() => setInspectCard(null)}
                    centered
                    size="lg"
                    contentClassName="bg-dark text-white border border-info shadow-lg rounded-3"
                    style={{ backdropFilter: 'blur(8px)' }}
                >
                    <Modal.Header closeButton closeVariant="white" className="border-secondary bg-black bg-opacity-60 py-2">
                        <Modal.Title className="text-info terminal-font fw-bold fs-6 d-flex align-items-center gap-2">
                            <span>CARD INSPECTOR</span>
                            <span className="text-white-50">// #{inspectCard.id}</span>
                        </Modal.Title>
                    </Modal.Header>

                    <Modal.Body className="p-4 bg-dark">
                        <Row className="g-3 align-items-stretch">
                            <Col md={5} className="d-flex flex-column justify-content-between">
                                <div className="text-center">
                                    <div className="vrains-card-art-container mx-auto mb-2">
                                        <img 
                                            src={inspectCard.image} 
                                            alt={inspectCard.name} 
                                            className="w-100 h-auto rounded"
                                            onError={(e) => {
                                                if (e.target.src !== inspectCard.fallbackImage && inspectCard.fallbackImage) {
                                                    e.target.src = inspectCard.fallbackImage;
                                                } else {
                                                    e.target.src = "https://ygoprodeck.com/images/cards/back.jpg";
                                                }
                                            }}
                                        />
                                    </div>
                                </div>

                                <div className="p-2 rounded bg-black bg-opacity-60 border border-info border-opacity-30">
                                    <div className="text-info small terminal-font mb-1 d-flex align-items-center justify-content-between" style={{ fontSize: '0.7rem' }}>
                                        <span>MARKET VALUATION</span>
                                        <span className="text-white-50" style={{ fontSize: '0.58rem' }}>TCG INDEX</span>
                                    </div>
                                    <Row className="g-1 text-center">
                                        <Col xs={4}>
                                            <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                                                <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>TCGPlayer</span>
                                                <span className="fw-bold text-success font-monospace" style={{ fontSize: '0.75rem' }}>
                                                    {inspectCard.prices?.tcgplayer}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col xs={4}>
                                            <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                                                <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>Cardmarket</span>
                                                <span className="fw-bold text-info font-monospace" style={{ fontSize: '0.75rem' }}>
                                                    {inspectCard.prices?.cardmarket}
                                                </span>
                                            </div>
                                        </Col>
                                        <Col xs={4}>
                                            <div className="p-1 rounded bg-dark border border-secondary border-opacity-25">
                                                <span className="text-white-50 d-block" style={{ fontSize: '0.58rem' }}>eBay</span>
                                                <span className="fw-bold text-warning font-monospace" style={{ fontSize: '0.75rem' }}>
                                                    {inspectCard.prices?.ebay}
                                                </span>
                                            </div>
                                        </Col>
                                    </Row>
                                </div>
                            </Col>

                            <Col md={7} className="d-flex flex-column">
                                <div className="p-3 rounded bg-black bg-opacity-50 border border-info border-opacity-30 position-relative flex-grow-1 d-flex flex-column">
                                    
                                    <div className="vrains-corner vrains-corner-tl"></div>
                                    <div className="vrains-corner vrains-corner-tr"></div>
                                    <div className="vrains-corner vrains-corner-bl"></div>
                                    <div className="vrains-corner vrains-corner-br"></div>

                                    <h3 className="fw-bold text-white mb-2" style={{ fontSize: '1.25rem' }}>{inspectCard.name}</h3>

                                    <div className="d-flex flex-wrap align-items-center gap-2 mb-2">
                                        {inspectCard.attribute && (
                                            <Badge className={`attr-${inspectCard.attribute.toUpperCase()} font-monospace px-2 py-1`}>
                                                {inspectCard.attribute.toUpperCase()}
                                            </Badge>
                                        )}
                                        <Badge bg="secondary" className="terminal-font">
                                            {inspectCard.type?.toUpperCase()}
                                        </Badge>
                                        {inspectCard.race && !inspectCard.type?.toUpperCase().includes(inspectCard.race.toUpperCase()) && (
                                            <Badge bg="dark" className="border border-secondary text-info terminal-font">
                                                {inspectCard.race.toUpperCase()}
                                            </Badge>
                                        )}
                                    </div>

                                    {inspectCard.level && (
                                        <div className="mb-2 p-2 rounded bg-black bg-opacity-40 border border-secondary border-opacity-25">
                                            {renderLevelStars(inspectCard.level)}
                                        </div>
                                    )}

                                    {(inspectCard.atk !== null || inspectCard.def !== null) && (
                                        <Row className="g-2 mb-2">
                                            <Col>
                                                <div className="vrains-stat-box py-1">
                                                    <span className="text-white-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>ATK</span>
                                                    <span className="fw-bold text-warning fs-6">
                                                        {inspectCard.atk ?? "—"}
                                                    </span>
                                                </div>
                                            </Col>
                                            <Col>
                                                <div className="vrains-stat-box py-1">
                                                    <span className="text-white-50 small terminal-font d-block" style={{ fontSize: '0.65rem' }}>DEF</span>
                                                    <span className="fw-bold text-info fs-6">
                                                        {inspectCard.def ?? "—"}
                                                    </span>
                                                </div>
                                            </Col>
                                        </Row>
                                    )}

                                    <Row className="g-2 mb-2">
                                        <Col xs={8}>
                                            <div className="p-2 rounded bg-black bg-opacity-60 border border-info border-opacity-25 h-100">
                                                <div className="text-info small terminal-font mb-1" style={{ fontSize: '0.62rem' }}>
                                                    BANLIST STATUS
                                                </div>
                                                <div className="d-flex align-items-center justify-content-between gap-1">
                                                    <div className="text-center flex-grow-1">
                                                        <span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>MD</span>
                                                        {renderBanBadge(inspectCard.banlist?.masterduel)}
                                                    </div>
                                                    <div className="text-center flex-grow-1">
                                                        <span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>TCG</span>
                                                        {renderBanBadge(inspectCard.banlist?.tcg)}
                                                    </div>
                                                    <div className="text-center flex-grow-1">
                                                        <span className="text-white-50 d-block" style={{ fontSize: '0.55rem' }}>OCG</span>
                                                        {renderBanBadge(inspectCard.banlist?.ocg)}
                                                    </div>
                                                </div>
                                            </div>
                                        </Col>

                                        <Col xs={4}>
                                            <div className="p-2 rounded bg-black bg-opacity-60 border border-info border-opacity-25 h-100 d-flex flex-column justify-content-between text-center">
                                                <span className="text-info small terminal-font d-block fw-bold" style={{ fontSize: '0.62rem' }}>
                                                     GENESYS POINTS
                                                </span>
                                                <div>
                                                    {inspectCard.isLinkOrPendulum ? (
                                                        <Badge bg="danger" className="terminal-font px-1 py-1" style={{ fontSize: '0.58rem' }}>
                                                            N/A (BANNED)
                                                        </Badge>
                                                    ) : (
                                                        <Badge bg="info" className="text-dark terminal-font px-2 py-1 fw-bold fs-6">
                                                            {inspectCard.genesysPoints} PTS
                                                        </Badge>
                                                    )}
                                                </div>
                                            </div>
                                        </Col>
                                    </Row>

                                    <div className="mt-1 flex-grow-1 d-flex flex-column">
                                        <label className="text-info small terminal-font mb-1 d-block" style={{ fontSize: '0.7rem' }}>
                                            CARD EFFECT
                                        </label>
                                        <div 
                                            className="p-3 rounded bg-black bg-opacity-60 text-white-50 small border border-secondary border-opacity-30 flex-grow-1"
                                            style={{ minHeight: '130px', maxHeight: '220px', overflowY: 'auto', whiteSpace: 'pre-line', fontSize: '0.82rem', lineHeight: '1.45' }}
                                        >
                                            {inspectCard.desc}
                                        </div>
                                    </div>

                                </div>
                            </Col>

                        </Row>
                    </Modal.Body>
                </Modal>
            )}

        </div>
    );
}