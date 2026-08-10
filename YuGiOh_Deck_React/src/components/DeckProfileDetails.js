'use client'; // 👈 Required for params, state, modals, & card inspector

import React, { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Container, Row, Col, Card, Badge, Spinner, Button } from 'react-bootstrap';
import AiDeckCopywriter from "./AiDeckCopywriter";
import AiComboPlaybook from "./AiComboPlaybook";
import '../mdstyles.css';
import DeckPriceWidget from "./DeckPriceWidget";

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

export default function DeckProfileDetails() {
    const params = useParams();
    const deckId = params?.deckId;

    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // Modal states
    const [showCopywriterModal, setShowCopywriterModal] = useState(false);
    const [showPlaybookModal, setShowPlaybookModal] = useState(false);

    // Inspector & Pie Chart States
    const [hoveredCardData, setHoveredCardData] = useState(null);
    const [pinnedCardData, setPinnedCardData] = useState(null);
    const [cardCounts, setCardCounts] = useState({ monsters: 0, spells: 0, traps: 0 });

    useEffect(() => {
        if (!deckId) return;

        const loadDeckData = async () => {
            try {
                const res = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb/${deckId}`);
                if (!res.ok) throw new Error("DECK_NOT_FOUND");
                const hydratedData = await res.json();
                setDeck(hydratedData);

                const mainDeck = hydratedData?.mainDeck || hydratedData?.MainDeck || [];
                let monsters = 0;
                let spells = 0;
                let traps = 0;

                mainDeck.forEach((card) => {
                    const type = (card.type || card.Type || '').toLowerCase();
                    if (type.includes('spell')) spells++;
                    else if (type.includes('trap')) traps++;
                    else monsters++;
                });

                setCardCounts({ monsters, spells, traps });

                if (mainDeck.length > 0) {
                    setHoveredCardData(mainDeck[0]);
                }
            } catch (err) {
                console.error("ARCHIVE_ACCESS_ERROR:", err);
                setError(err.message || "Failed to load deck");
            } finally {
                setLoading(false);
            }
        };
        loadDeckData();
    }, [deckId]);

    const handleExportYDK = () => {
        if (!deck) return;

        let ydkContent = "#created by ErreGeTe YGO\n#main\n";
        
        const mainDeck = deck.mainDeck || deck.MainDeck || [];
        const extraDeck = deck.extraDeck || deck.ExtraDeck || [];
        const sideDeck = deck.sideDeck || deck.SideDeck || [];

        mainDeck.forEach(card => {
            const cId = typeof card === 'object' ? (card.id || card.Id) : card;
            if (cId) ydkContent += `${cId}\n`;
        });

        ydkContent += "#extra\n";
        extraDeck.forEach(card => {
            const cId = typeof card === 'object' ? (card.id || card.Id) : card;
            if (cId) ydkContent += `${cId}\n`;
        });

        ydkContent += "!side\n";
        sideDeck.forEach(card => {
            const cId = typeof card === 'object' ? (card.id || card.Id) : card;
            if (cId) ydkContent += `${cId}\n`;
        });

        const blob = new Blob([ydkContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        link.href = url;
        link.download = `${(deck.title || deck.Title || 'deck').replace(/\s+/g, '_')}.ydk`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="md-theme-bg min-vh-100 d-flex flex-column justify-content-center align-items-center mt-5">
            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '30rem' }} className="border-info p-4 text-center md-panel shadow-lg">
                <Card.Body>
                    <Spinner animation="border" variant="info" className="mb-3" style={{ width: '3rem', height: '3rem' }} />
                    <h5 className="text-info terminal-font fw-bold m-0" style={{ letterSpacing: '2px' }}>
                        SYNCHRONIZING WITH AZURE DATABASE...
                    </h5>
                </Card.Body>
            </Card>
        </div>
    );

    if (error || !deck) return (
        <div className="md-theme-bg min-vh-100 d-flex justify-content-center align-items-center mt-5">
            <Card style={{ backgroundColor: 'rgba(20, 8, 8, 0.95)', backdropFilter: 'blur(10px)', maxWidth: '32rem' }} className="border-danger p-4 text-center md-panel shadow-lg text-white">
                <Card.Body>
                    <h4 className="text-danger terminal-font fw-bold mb-3">⚠️ DECK NOT FOUND</h4>
                    <p className="text-white-50">{error || 'DECK_DATA_CORRUPTED_OR_MISSING'}</p>
                    <Button as={Link} href="/profile" variant="outline-danger" className="terminal-font fw-bold">
                        RETURN TO PROFILE
                    </Button>
                </Card.Body>
            </Card>
        </div>
    );

    const title = deck.title || deck.Title || "UNNAMED_DECK";
    const mainDeck = deck.mainDeck || deck.MainDeck || [];
    const extraDeck = deck.extraDeck || deck.ExtraDeck || [];
    const sideDeck = deck.sideDeck || deck.SideDeck || [];

    const totalCards = cardCounts.monsters + cardCounts.spells + cardCounts.traps || mainDeck.length || 1;
    const monsterPct = Math.round((cardCounts.monsters / totalCards) * 100);
    const spellPct = Math.round((cardCounts.spells / totalCards) * 100);
    const trapPct = Math.max(0, 100 - (monsterPct + spellPct));

    const monsterDeg = (monsterPct / 100) * 360;
    const spellDeg = monsterDeg + (spellPct / 100) * 360;

    const activeCard = pinnedCardData || hoveredCardData || mainDeck[0] || {};
    const activeName = typeof activeCard === 'object' ? (activeCard.name || activeCard.Name || title) : title;
    const activeType = typeof activeCard === 'object' ? (activeCard.type || activeCard.Type) : '';
    const activeRace = typeof activeCard === 'object' ? (activeCard.race || activeCard.Race) : '';
    const activeAttribute = typeof activeCard === 'object' ? (activeCard.attribute || activeCard.Attribute) : '';
    const activeLevel = typeof activeCard === 'object' ? (activeCard.level || activeCard.Level) : null;
    const activeAtk = typeof activeCard === 'object' ? (activeCard.atk ?? activeCard.Atk) : null;
    const activeDef = typeof activeCard === 'object' ? (activeCard.def ?? activeCard.Def) : null;
    const activeDesc = typeof activeCard === 'object' ? (activeCard.desc || activeCard.Desc || 'Click or hover over any card thumbnail in the decklists below to view its full stats and effect text.') : 'Hover over a card to view details.';

    const getCardSmallImg = (card) => {
        if (!card) return 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
        if (typeof card === 'object') {
            if (card.card_images?.[0]?.image_url_small) return card.card_images[0].image_url_small;
            if (card.image) return card.image;
            if (card.Image) return card.Image;
            const cid = card.id || card.Id;
            if (cid) return `https://images.ygoprodeck.com/images/cards_small/${cid}.jpg`;
        }
        return `https://images.ygoprodeck.com/images/cards_small/${card}.jpg`;
    };

    const getCardLargeImg = (card) => {
        if (!card) return 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
        if (typeof card === 'object') {
            if (card.card_images?.[0]?.image_url) return card.card_images[0].image_url;
            if (card.image) return card.image;
            if (card.Image) return card.Image;
            const cid = card.id || card.Id;
            if (cid) return `https://images.ygoprodeck.com/images/cards/${cid}.jpg`;
        }
        return `https://images.ygoprodeck.com/images/cards/${card}.jpg`;
    };

    const activeImageUrl = getCardLargeImg(activeCard);

    const handleCardHover = (card) => {
        if (!pinnedCardData && card) {
            setHoveredCardData(card);
        }
    };

    const handleCardClick = (card) => {
        if (!card) return;
        const cardId = typeof card === 'object' ? (card.id || card.Id) : card;
        const pinnedId = pinnedCardData ? (typeof pinnedCardData === 'object' ? (pinnedCardData.id || pinnedCardData.Id) : pinnedCardData) : null;

        if (pinnedId && pinnedId === cardId) {
            setPinnedCardData(null);
        } else {
            setPinnedCardData(card);
        }
    };

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5">
            <Container fluid="xl">
                {/* --- HEADER PANEL WITH DECK TITLE & ACTION TOOLBAR --- */}
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-4 mb-4 md-panel">
                    <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-3 mb-4">
                        <Row className="align-items-center gy-3">
                            <Col lg={5} md={12}>
                                <h2 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '2px' }}>
                                    {title.toUpperCase()}
                                </h2>
                                <span className="small text-white-50">FILE_PATH: ROOT/DECKS/{deck.id || deck.Id}</span>
                            </Col>

                            <Col lg={7} md={12} className="d-flex justify-content-lg-end justify-content-start align-items-stretch flex-wrap gap-2">
                                <Button 
                                    variant="outline-info" 
                                    className="terminal-font fw-bold px-3 py-2 d-inline-flex align-items-center justify-content-center"
                                    onClick={() => setShowCopywriterModal(true)}
                                >
                                    ✍️ DECK ARTICLE
                                </Button>

                                <Button 
                                    variant="outline-warning" 
                                    className="terminal-font fw-bold px-3 py-2 d-inline-flex align-items-center justify-content-center"
                                    onClick={() => setShowPlaybookModal(true)}
                                >
                                    🎮 COMBO PLAYBOOK
                                </Button>

                                <Button 
                                    onClick={handleExportYDK} 
                                    variant="outline-success" 
                                    className="terminal-font fw-bold px-3 py-2 d-inline-flex align-items-center justify-content-center"
                                >
                                    📥 EXPORT YDK
                                </Button>

                                <Button 
                                    as={Link} 
                                    href="/profile" 
                                    variant="outline-info" 
                                    className="terminal-font fw-bold px-3 py-2 d-inline-flex align-items-center justify-content-center"
                                >
                                    ⬅️ BACK
                                </Button>
                            </Col>
                        </Row>
                    </Card.Header>

                    <Card.Body className="p-0">
                        {/* --- PIE CHART & RATIO SUMMARY BAR --- */}
                        <div className="p-3 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                            <h5 className="text-info terminal-font fw-bold border-bottom border-info border-opacity-25 pb-2 mb-3">
                                📊 MAIN DECK COMPOSITION RATIO
                            </h5>

                            <Row className="align-items-center g-3">
                                <Col sm={4} md={3} className="d-flex justify-content-center">
                                    <div
                                        style={{
                                            width: '130px',
                                            height: '130px',
                                            borderRadius: '50%',
                                            background: `conic-gradient(
                                                #eab308 0deg ${monsterDeg}deg, 
                                                #10b981 ${monsterDeg}deg ${spellDeg}deg, 
                                                #ec4899 ${spellDeg}deg 360deg
                                            )`,
                                            border: '2px solid rgba(255, 255, 255, 0.2)',
                                            boxShadow: '0 0 20px rgba(0, 240, 255, 0.2)',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center'
                                        }}
                                    >
                                        <div
                                            style={{
                                                width: '60px',
                                                height: '60px',
                                                borderRadius: '50%',
                                                backgroundColor: 'rgba(8, 12, 20, 0.98)',
                                                display: 'flex',
                                                alignItems: 'center',
                                                justifyContent: 'center',
                                                flexDirection: 'column'
                                            }}
                                        >
                                            <span className="small text-white-50 fw-bold" style={{ fontSize: '0.6rem' }}>TOTAL</span>
                                            <span className="text-info fw-bold">{mainDeck.length || totalCards}</span>
                                        </div>
                                    </div>
                                </Col>

                                <Col sm={8} md={9}>
                                    <Row className="g-2">
                                        <Col md={4}>
                                            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: 'rgba(234, 179, 8, 0.1)', border: '1px solid rgba(234, 179, 8, 0.3)' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{ width: '12px', height: '12px', backgroundColor: '#eab308', borderRadius: '3px', display: 'inline-block' }}></span>
                                                    <span className="small text-white fw-bold">MONSTERS</span>
                                                </div>
                                                <span className="text-warning fw-bold">{cardCounts.monsters} ({monsterPct}%)</span>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{ width: '12px', height: '12px', backgroundColor: '#10b981', borderRadius: '3px', display: 'inline-block' }}></span>
                                                    <span className="small text-white fw-bold">SPELLS</span>
                                                </div>
                                                <span className="text-success fw-bold">{cardCounts.spells} ({spellPct}%)</span>
                                            </div>
                                        </Col>
                                        <Col md={4}>
                                            <div className="d-flex align-items-center justify-content-between p-2 rounded" style={{ backgroundColor: 'rgba(236, 72, 153, 0.1)', border: '1px solid rgba(236, 72, 153, 0.3)' }}>
                                                <div className="d-flex align-items-center gap-2">
                                                    <span style={{ width: '12px', height: '12px', backgroundColor: '#ec4899', borderRadius: '3px', display: 'inline-block' }}></span>
                                                    <span className="small text-white fw-bold">TRAPS</span>
                                                </div>
                                                <span className="text-danger fw-bold">{cardCounts.traps} ({trapPct}%)</span>
                                            </div>
                                        </Col>
                                    </Row>
                                </Col>
                            </Row>
                        </div>
                    </Card.Body>
                </Card>

                {/* --- TWO-COLUMN CONTENT AREA --- */}
                <Row className="g-4">
                    <Col lg={5} className="order-lg-1">
                        <div style={{ position: 'sticky', top: '90px' }}>
                            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
                                <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-3 d-flex justify-content-between align-items-center">
                                    <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
                                        🔍 CARD INSPECTOR
                                    </h6>
                                    {pinnedCardData ? (
                                        <Badge 
                                            bg="info" 
                                            className="text-dark fw-bold terminal-font text-uppercase px-2 py-1"
                                            style={{ cursor: 'pointer' }}
                                            onClick={() => setPinnedCardData(null)}
                                            title="Click to unlock inspector"
                                        >
                                            📌 PINNED (CLICK UNPIN)
                                        </Badge>
                                    ) : (
                                        <span className="small text-white-50" style={{ fontSize: '0.75rem' }}>
                                            💡 Click card to lock
                                        </span>
                                    )}
                                </Card.Header>

                                <Card.Body className="p-2">
                                    <Row className="g-3 align-items-start">
                                        <Col xs={12} sm={5} className="text-center">
                                            <img
                                                src={activeImageUrl}
                                                alt={activeName}
                                                className="img-fluid rounded border border-info border-opacity-50 shadow"
                                                style={{ maxHeight: '280px', objectFit: 'contain', boxShadow: '0 0 20px rgba(0, 240, 255, 0.3)' }}
                                                onError={(e) => {
                                                    e.target.onerror = null;
                                                    e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                                }}
                                            />
                                        </Col>

                                        <div className="col-12 col-sm-7">
                                            <h5 className="fw-bold mb-2 text-white" style={{ fontFamily: "Cascadia Mono, monospace", letterSpacing: '1px', fontSize: '1rem' }}>
                                                {activeName}
                                            </h5>

                                            <div className="d-flex align-items-center mb-2 flex-wrap gap-1">
                                                {activeType && (
                                                    <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                                        {activeType}
                                                    </Badge>
                                                )}
                                                {activeRace && (
                                                    <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                                        {activeRace}
                                                    </Badge>
                                                )}
                                                {activeAttribute && (
                                                    <Badge bg={getAttributeColor(activeAttribute)} className="ms-auto text-uppercase fs-7 fw-bold">
                                                        {activeAttribute}
                                                    </Badge>
                                                )}
                                            </div>

                                            {activeLevel && (
                                                <div className="mb-2 text-start">
                                                    <span className="small text-white-50 fw-bold me-2">Level / Rank:</span>
                                                    <span className="text-info fw-bold">{activeLevel} ★</span>
                                                </div>
                                            )}

                                            {typeof activeAtk === 'number' && (
                                                <div className="d-flex align-items-center px-3 py-1 mb-2 rounded" style={{ backgroundColor: 'rgba(0, 240, 255, 0.08)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                                    <span className="small text-white-50 fw-bold me-2">ATK /</span>
                                                    <span className="text-white fw-bold me-4">{activeAtk}</span>
                                                    
                                                    <span className="small text-white-50 fw-bold me-2">DEF /</span>
                                                    <span className="text-white fw-bold">{activeDef ?? '-'}</span>
                                                </div>
                                            )}

                                            <div className="text-start p-2 rounded" style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', border: '1px solid rgba(0, 240, 255, 0.2)' }}>
                                                <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-2">
                                                    Card Effect / Text
                                                </h6>
                                                <p className="text-white-50 m-0" style={{ fontSize: '0.82rem', lineHeight: '1.45', minHeight: '160px', maxHeight: '260px', overflowY: 'auto' }}>
                                                    {activeDesc}
                                                </p>
                                            </div>
                                        </div>
                                    </Row>
                                </Card.Body>
                            </Card>

                            <DeckPriceWidget 
                                mainDeck={mainDeck} 
                                extraDeck={extraDeck} 
                                sideDeck={sideDeck} 
                            />
                        </div>
                    </Col>

                    <Col lg={7} className="order-lg-2">
                        <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
                            <Card.Header className="bg-transparent border-bottom border-info border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                                <h5 className="m-0 text-info terminal-font fw-bold">
                                    MAIN DECK ({mainDeck.length})
                                </h5>
                                <span className="small text-white-50">40 - 60 Cards</span>
                            </Card.Header>
                            <Card.Body className="p-1">
                                <div className="d-flex flex-wrap gap-2 justify-content-start">
                                    {mainDeck.map((card, index) => {
                                        const cardId = typeof card === 'object' ? (card.id || card.Id) : card;
                                        const imgUrl = getCardSmallImg(card);
                                        const isPinned = pinnedCardData && (typeof pinnedCardData === 'object' ? (pinnedCardData.id || pinnedCardData.Id) : pinnedCardData) === cardId;

                                        return (
                                            <div
                                                key={`main-${cardId}-${index}`}
                                                className="position-relative card-thumbnail-wrap"
                                                style={{ 
                                                    cursor: 'pointer', 
                                                    transition: 'transform 0.15s ease, filter 0.15s ease',
                                                    transform: isPinned ? 'scale(1.08)' : 'scale(1)',
                                                    zIndex: isPinned ? 2 : 1
                                                }}
                                                onMouseEnter={() => handleCardHover(card)}
                                                onClick={() => handleCardClick(card)}
                                            >
                                                <img
                                                    src={imgUrl}
                                                    alt={typeof card === 'object' ? (card.name || card.Name || cardId) : cardId}
                                                    className={`rounded border ${isPinned ? 'border-info border-2 shadow-lg' : 'border-secondary'}`}
                                                    style={{ width: '62px', height: '90px', objectFit: 'cover' }}
                                                    onError={(e) => {
                                                        e.target.onerror = null;
                                                        e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                                    }}
                                                />
                                            </div>
                                        );
                                    })}
                                </div>
                            </Card.Body>
                        </Card>

                        {extraDeck.length > 0 && (
                            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-warning border-opacity-50 shadow-lg p-3 mb-4 md-panel">
                                <Card.Header className="bg-transparent border-bottom border-warning border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                                    <h5 className="m-0 text-warning terminal-font fw-bold">
                                        EXTRA DECK ({extraDeck.length})
                                    </h5>
                                    <span className="small text-white-50">0 - 15 Cards</span>
                                </Card.Header>
                                <Card.Body className="p-1">
                                    <div className="d-flex flex-wrap gap-2 justify-content-start">
                                        {extraDeck.map((card, index) => {
                                            const cardId = typeof card === 'object' ? (card.id || card.Id) : card;
                                            const imgUrl = getCardSmallImg(card);
                                            const isPinned = pinnedCardData && (typeof pinnedCardData === 'object' ? (pinnedCardData.id || pinnedCardData.Id) : pinnedCardData) === cardId;

                                            return (
                                                <div
                                                    key={`extra-${cardId}-${index}`}
                                                    className="position-relative card-thumbnail-wrap"
                                                    style={{ 
                                                        cursor: 'pointer', 
                                                        transition: 'transform 0.15s ease, filter 0.15s ease',
                                                        transform: isPinned ? 'scale(1.08)' : 'scale(1)',
                                                        zIndex: isPinned ? 2 : 1
                                                    }}
                                                    onMouseEnter={() => handleCardHover(card)}
                                                    onClick={() => handleCardClick(card)}
                                                >
                                                    <img
                                                        src={imgUrl}
                                                        alt={typeof card === 'object' ? (card.name || card.Name || cardId) : cardId}
                                                        className={`rounded border ${isPinned ? 'border-warning border-2 shadow-lg' : 'border-warning border-opacity-50'}`}
                                                        style={{ width: '62px', height: '90px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}

                        {sideDeck.length > 0 && (
                            <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.95)', backdropFilter: 'blur(10px)' }} text="white" className="border-success border-opacity-50 shadow-lg p-3 mb-4 md-panel">
                                <Card.Header className="bg-transparent border-bottom border-success border-opacity-25 pb-2 mb-3 d-flex justify-content-between align-items-center">
                                    <h5 className="m-0 text-success terminal-font fw-bold">
                                        ⚔️ SIDE DECK ({sideDeck.length})
                                    </h5>
                                    <span className="small text-white-50">0 - 15 Cards</span>
                                </Card.Header>
                                <Card.Body className="p-1">
                                    <div className="d-flex flex-wrap gap-2 justify-content-start">
                                        {sideDeck.map((card, index) => {
                                            const cardId = typeof card === 'object' ? (card.id || card.Id) : card;
                                            const imgUrl = getCardSmallImg(card);
                                            const isPinned = pinnedCardData && (typeof pinnedCardData === 'object' ? (pinnedCardData.id || pinnedCardData.Id) : pinnedCardData) === cardId;

                                            return (
                                                <div
                                                    key={`side-${cardId}-${index}`}
                                                    className="position-relative card-thumbnail-wrap"
                                                    style={{ 
                                                        cursor: 'pointer', 
                                                        transition: 'transform 0.15s ease, filter 0.15s ease',
                                                        transform: isPinned ? 'scale(1.08)' : 'scale(1)',
                                                        zIndex: isPinned ? 2 : 1
                                                    }}
                                                    onMouseEnter={() => handleCardHover(card)}
                                                    onClick={() => handleCardClick(card)}
                                                >
                                                    <img
                                                        src={imgUrl}
                                                        alt={typeof card === 'object' ? (card.name || card.Name || cardId) : cardId}
                                                        className={`rounded border ${isPinned ? 'border-success border-2 shadow-lg' : 'border-success border-opacity-50'}`}
                                                        style={{ width: '62px', height: '90px', objectFit: 'cover' }}
                                                        onError={(e) => {
                                                            e.target.onerror = null;
                                                            e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                                        }}
                                                    />
                                                </div>
                                            );
                                        })}
                                    </div>
                                </Card.Body>
                            </Card>
                        )}
                    </Col>
                </Row>
            </Container>

            {/* MODALS */}
            <AiDeckCopywriter
                show={showCopywriterModal}
                onHide={() => setShowCopywriterModal(false)}
                deckName={title}
                mainDeck={mainDeck}
                extraDeck={extraDeck}
            />
            <AiComboPlaybook
                show={showPlaybookModal}
                onHide={() => setShowPlaybookModal(false)}
                deckName={title}
                mainDeck={mainDeck}
                extraDeck={extraDeck}
            />
        </div>
    );
}