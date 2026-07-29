import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Row, Col, Modal, Form, Badge, Card, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { 
    addCardToDeck, 
    removeCardFromDeck, 
    updateDeckName, 
    importYdkDeck,
    clearDeck 
} from "../store/deckSlice";

import CardApi from "../components/CardApi";
import CustomDeck from "./CustomDeck";
import AiCardSuggester from "./AiCardSuggester";
import { deckList } from "../components/CardApi";
import '../mdstyles.css';

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

export default function DeckBuilder({ user }) {
    const mainDeck = useSelector((state) => state.deck.mainDeck || []);
    const extraDeck = useSelector((state) => state.deck.extraDeck || []);
    const deckName = useSelector((state) => state.deck.deckName || 'NEW DECK');
    const dispatch = useDispatch();

    const [showSaveModal, setShowSaveModal] = useState(false);
    const [showAiModal, setShowAiModal] = useState(false);
    const [isImporting, setIsImporting] = useState(false);
    
    // Inspector States
    const [inspectedCard, setInspectedCard] = useState(null);
    const [pinnedCard, setPinnedCard] = useState(null);

    const fileInputRef = useRef(null);

    // ⌨️ ESC Key Shortcut to unlock card inspector view
    useEffect(() => {
        const handleKeyDown = (e) => {
            if (e.key === 'Escape') {
                setPinnedCard(null);
            }
        };
        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, []);

    // Sync state to export deckList helper
    useEffect(() => {
        deckList.mainDeck = mainDeck;
        deckList.extraDeck = extraDeck;
    }, [mainDeck, extraDeck]);

    // Toggle Pin/Lock Card in Inspector
    const handlePinCard = (card) => {
        if (!card) return;
        const cardId = card.id || card.Id;
        const pinnedId = pinnedCard?.id || pinnedCard?.Id;

        if (pinnedId === cardId) {
            setPinnedCard(null); // Unpin if clicking same card
        } else {
            setPinnedCard(card); // Lock new card
            setInspectedCard(card);
        }
    };

    // Hydrated YDK File Import Handler
    const handleImportYDK = async (event) => {
        const file = event.target.files[0];
        if (!file) return;

        setIsImporting(true);

        const reader = new FileReader();
        reader.onload = async (e) => {
            const content = e.target.result;
            const lines = content.split(/\r?\n/);
            const mainIds = [];
            const extraIds = [];
            let currentSection = 'main';

            lines.forEach((line) => {
                const trimmed = line.trim();

                if (trimmed === '#main') {
                    currentSection = 'main';
                } else if (trimmed === '#extra') {
                    currentSection = 'extra';
                } else if (trimmed === '!side') {
                    currentSection = 'side';
                } else if (trimmed.startsWith('#') || !trimmed || currentSection === 'side') {
                    return;
                } else if (/^\d+$/.test(trimmed)) {
                    if (currentSection === 'main') mainIds.push(trimmed);
                    else if (currentSection === 'extra') extraIds.push(trimmed);
                }
            });

            const allUniqueIds = [...new Set([...mainIds, ...extraIds])];

            if (allUniqueIds.length === 0) {
                alert('No valid card IDs found in YDK file.');
                setIsImporting(false);
                return;
            }

            try {
                const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${allUniqueIds.join(',')}`);
                const data = await res.json();
                
                const cardMap = {};
                if (data?.data) {
                    data.data.forEach((card) => {
                        const extraDeckFrames = ['fusion', 'synchro', 'xyz', 'link', 'fusion_pendulum', 'synchro_pendulum', 'xyz_pendulum'];
                        const isExtraDeck = extraDeckFrames.includes(card.frameType?.toLowerCase());
                        
                        cardMap[card.id.toString()] = {
                            ...card,
                            isExtraDeck,
                            image: `https://ygocardstore.blob.core.windows.net/card-images/${card.id}.jpg`,
                            fallbackImage: card.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${card.id}.jpg`
                        };
                    });
                }

                const mainDeckCards = mainIds.map((id, index) => {
                    const fullCard = cardMap[id] || { id, name: `Card #${id}` };
                    return {
                        ...fullCard,
                        instanceId: `${id}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`
                    };
                });

                const extraDeckCards = extraIds.map((id, index) => {
                    const fullCard = cardMap[id] || { id, name: `Card #${id}` };
                    return {
                        ...fullCard,
                        instanceId: `${id}-${Date.now()}-${index}-${Math.random().toString(36).substring(2, 6)}`
                    };
                });

                dispatch(importYdkDeck({ 
                    main: mainDeckCards, 
                    extra: extraDeckCards, 
                    name: file.name.replace('.ydk', '').replace(/_/g, ' ').toUpperCase() 
                }));

            } catch (err) {
                console.error("Failed to hydrate YDK cards:", err);
                alert("Imported YDK file, but could not fetch full card details from server.");
            } finally {
                setIsImporting(false);
            }
        };

        reader.readAsText(file);
        if (event.target) event.target.value = null;
    };

    // Export YDK Handler
    const handleExportYDK = () => {
        if (mainDeck.length === 0 && extraDeck.length === 0) {
            alert("DECK_IS_EMPTY: Add cards before exporting.");
            return;
        }

        let ydkContent = "#created by ErreGeTe YGO\n#main\n";
        
        mainDeck.forEach(card => {
            const cardId = card.id || card.Id;
            if (cardId) ydkContent += `${cardId}\n`;
        });

        ydkContent += "#extra\n";
        extraDeck.forEach(card => {
            const cardId = card.id || card.Id;
            if (cardId) ydkContent += `${cardId}\n`;
        });

        ydkContent += "!side\n";

        const blob = new Blob([ydkContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        link.href = url;
        link.download = `${(deckName || 'custom_deck').replace(/\s+/g, '_')}.ydk`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    // Clear Deck Handler
    const handleClearDeck = () => {
        if (mainDeck.length === 0 && extraDeck.length === 0 && !deckName) return;

        if (window.confirm("SYSTEM_WARNING: Are you sure you want to clear all cards and the deck name?")) {
            dispatch(clearDeck());
        }
    };

    // Max 3 Copies Rule & Instance ID Assignment
    const handleAddCard = (card) => {
        if (!card) return;
        const cardId = String(card.id || card.Id);

        const existingCopies = [...mainDeck, ...extraDeck].filter(
            (c) => String(c.id || c.Id) === cardId
        ).length;

        if (existingCopies >= 3) {
            alert(`DECK_RULE_VIOLATION: Maximum 3 copies of "${card.name || 'this card'}" allowed.`);
            return;
        }

        const cardWithInstance = {
            ...card,
            instanceId: `${cardId}-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`
        };

        dispatch(addCardToDeck(cardWithInstance));
    };

    // Remove Card Handler
    const handleDeleteCard = (cardId, instanceId) => {
        if (instanceId) {
            dispatch(removeCardFromDeck(instanceId));
        } else if (cardId) {
            const cardIdStr = String(cardId);
            const targetCard = [...mainDeck, ...extraDeck]
                .slice()
                .reverse()
                .find(c => String(c.id || c.Id) === cardIdStr);
            
            if (targetCard?.instanceId) {
                dispatch(removeCardFromDeck(targetCard.instanceId));
            }
        }
    };

    // Save Deck to MongoDB API
    const handleSave = async () => {
        if (!user?.id) return;
        
        const payload = {
            id: String(Math.floor(Math.random() * 1000000) + 1),
            title: deckName || "NEW_DECKLIST",
            userId: String(user.id),
            mainDeck: mainDeck.map(card => String(card.id || card.Id)), 
            extraDeck: extraDeck.map(card => String(card.id || card.Id)),
            sideDeck: []
        };

        try {
            const response = await fetch("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });
            if (response.ok) setShowSaveModal(true);
        } catch (err) {
            console.error("SAVE_ERROR:", err);
        }
    };

    // Active Card for Inspector (Pinned beats Hovered)
    const activeCard = pinnedCard || inspectedCard || mainDeck[0] || extraDeck[0] || {
        name: 'DECK BUILDER STUDIO',
        type: 'BUILDER MODE',
        desc: 'Left-click search cards to add. Right-click deck cards to remove. Right-click search cards or Left-click deck cards to lock the inspector view.'
    };

    const activeImageUrl = activeCard.image || activeCard.card_images?.[0]?.image_url ||
        ((activeCard.id || activeCard.Id) ? `https://ygocardstore.blob.core.windows.net/card-images/${activeCard.id || activeCard.Id}.jpg` : 'https://images.ygoprodeck.com/images/cards/back_high.jpg');

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5">
            <input 
                type="file" 
                accept=".ydk" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={handleImportYDK} 
            />

            <Container fluid className="px-4">
                {/* --- 1. TOP HEADER & CONTROL TOOLBAR --- */}
                <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className="border-info shadow-lg p-3 mb-4 md-panel">
                    <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2">
                        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                            
                            {/* Title & Deck Name Input */}
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                                <h4 className="m-0 text-info terminal-font text-nowrap">DECK_EDITOR_V2</h4>
                                <Form.Control 
                                    className="bg-black text-info border-info terminal-font fw-bold fs-5 shadow-none flex-grow-1"
                                    placeholder={isImporting ? "SYNCHRONIZING..." : "ENTER_DECK_NAME..."}
                                    value={deckName} 
                                    onChange={(e) => dispatch(updateDeckName(e.target.value))} 
                                    disabled={isImporting}
                                    style={{ maxWidth: '400px', letterSpacing: '1px' }}
                                />
                            </div>

                            {/* Toolbar Buttons */}
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                <Button 
                                    variant="warning" 
                                    className="terminal-font text-dark fw-bold text-nowrap"
                                    onClick={() => setShowAiModal(true)}
                                >
                                    🤖 AI SUGGEST
                                </Button>

                                <div className="vr bg-info opacity-25 d-none d-sm-block mx-1" style={{ height: '24px' }}></div>

                                {/* File Operations */}
                                <Button 
                                    variant="outline-success"
                                    disabled={isImporting} 
                                    className="terminal-font fw-bold text-nowrap"
                                    onClick={() => fileInputRef.current?.click()}
                                >
                                    {isImporting ? <Spinner size="sm" animation="border" /> : "IMPORT YDK"}
                                </Button>

                                <Button 
                                    variant="outline-success" 
                                    className="terminal-font fw-bold text-nowrap"
                                    onClick={handleExportYDK}
                                >
                                    EXPORT YDK
                                </Button>

                                <div className="vr bg-info opacity-25 d-none d-sm-block mx-1" style={{ height: '24px' }}></div>

                                {/* Clear Button */}
                                <Button 
                                    variant="outline-danger" 
                                    className="terminal-font fw-bold text-nowrap px-3"
                                    onClick={handleClearDeck}
                                >
                                    CLEAR
                                </Button>

                                <div className="vr bg-info opacity-25 d-none d-sm-block mx-1" style={{ height: '24px' }}></div>

                                {/* 🔒 RESTORED: AUTH PROTECTED SAVE DECK BUTTON */}
                                {!user ? (
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id="archive-disabled-tooltip">Must be logged in to save</Tooltip>}
                                    >
                                        <span className="d-inline-block">
                                            <Button 
                                                variant="success" 
                                                className="text-nowrap fw-bold terminal-font" 
                                                disabled 
                                                style={{ pointerEvents: 'none' }}
                                            >
                                                SAVE DECK
                                            </Button>
                                        </span>
                                    </OverlayTrigger>
                                ) : (
                                    <Button 
                                        variant="success"
                                        className="text-nowrap fw-bold terminal-font" 
                                        onClick={handleSave} 
                                        disabled={isImporting}
                                    >
                                        SAVE DECK
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card.Header>
                </Card>

                {/* --- 2. STICKY TOP CARD INSPECTOR --- */}
                <div 
                    style={{ 
                        position: 'sticky', 
                        top: '85px', 
                        zIndex: 1020,
                        transition: 'top 0.2s ease'
                    }}
                    className="mb-4"
                >
                    <Card style={{ backgroundColor: 'rgba(8, 12, 20, 0.98)', backdropFilter: 'blur(10px)' }} text="white" className={`shadow-lg p-3 md-panel ${pinnedCard ? 'border-warning' : 'border-info'}`}>
                        <Card.Header className="bg-transparent border-bottom border-info border-opacity-50 pb-2 mb-3 d-flex justify-content-between align-items-center">
                            <h6 className="m-0 text-info terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
                                🔍 CARD INSPECTOR
                            </h6>
                            
                            {pinnedCard ? (
                                <Badge 
                                    bg="warning" 
                                    className="text-dark fw-bold terminal-font text-uppercase px-2 py-1 shadow"
                                    style={{ cursor: 'pointer' }}
                                    onClick={() => setPinnedCard(null)}
                                    title="Click or press ESC to unlock hover inspector"
                                >
                                    📌 CARD LOCKED (CLICK OR ESC TO UNLOCK)
                                </Badge>
                            ) : (
                                <Button
                                    variant="outline-info"
                                    size="sm"
                                    className="terminal-font py-0 px-2 fw-bold"
                                    style={{ fontSize: '0.72rem' }}
                                    onClick={() => handlePinCard(activeCard)}
                                >
                                    🔒 LOCK CURRENT VIEW
                                </Button>
                            )}
                        </Card.Header>

                        <Card.Body className="p-2">
                            <Row className="g-3 align-items-center">
                                {/* Artwork Image */}
                                <Col xs={12} sm={4} md={3} className="text-center">
                                    <img
                                        src={activeImageUrl}
                                        alt={activeCard.name}
                                        className="img-fluid rounded border border-info border-opacity-50"
                                        style={{ 
                                            maxHeight: '280px', 
                                            objectFit: 'contain',
                                            boxShadow: pinnedCard ? '0 0 20px rgba(251, 191, 36, 0.4)' : '0 0 15px rgba(0, 240, 255, 0.25)' 
                                        }}
                                        onError={(e) => {
                                            e.target.onerror = null;
                                            e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                                        }}
                                    />
                                </Col>

                                {/* Stats & Badges */}
                                <Col xs={12} sm={4} md={4}>
                                    <h4 className="fw-bold mb-2 text-white terminal-font">
                                        {activeCard.name}
                                    </h4>

                                    <div className="d-flex align-items-center mb-2 flex-wrap gap-1">
                                        {activeCard.type && (
                                            <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                                {activeCard.type}
                                            </Badge>
                                        )}
                                        {activeCard.race && (
                                            <Badge bg="dark" className="border border-secondary text-uppercase fs-7">
                                                {activeCard.race}
                                            </Badge>
                                        )}
                                        {activeCard.attribute && (
                                            <Badge bg={getAttributeColor(activeCard.attribute)} className="text-uppercase fs-7 fw-bold ms-auto">
                                                {activeCard.attribute}
                                            </Badge>
                                        )}
                                    </div>

                                    {activeCard.level && (
                                        <div className="mb-2 text-info fw-bold fs-6">
                                            Level / Rank: {activeCard.level} ★
                                        </div>
                                    )}

                                    {typeof activeCard.atk === 'number' && (
                                        <div className="d-flex align-items-center px-3 py-2 rounded bg-black border border-secondary">
                                            <span className="text-white-50 me-2 fw-bold">ATK /</span>
                                            <span className="text-white fw-bold fs-5 me-4">{activeCard.atk}</span>
                                            <span className="text-white-50 me-2 fw-bold">DEF /</span>
                                            <span className="text-white fw-bold fs-5">{activeCard.def ?? '-'}</span>
                                        </div>
                                    )}
                                </Col>

                                {/* Effect Text Box */}
                                <Col xs={12} sm={4} md={5}>
                                    <div className="p-3 rounded bg-black border border-secondary h-100">
                                        <h6 className="small text-info fw-bold border-bottom border-info border-opacity-25 pb-1 mb-2">
                                            Card Effect / Text
                                        </h6>
                                        <p className="text-white-50 m-0" style={{ fontSize: '0.85rem', lineHeight: '1.5', maxHeight: '180px', overflowY: 'auto' }}>
                                            {activeCard.desc || activeCard.effect}
                                        </p>
                                    </div>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </div>

                {/* --- 3. MAIN WORKSPACE --- */}
                <Row className="g-4">
                    {/* LEFT COLUMN: CANVAS */}
                    <Col lg={7}>
                        <CustomDeck 
                            mainDeck={mainDeck} 
                            extraDeck={extraDeck} 
                            onDeleteCard={handleDeleteCard}
                            onInspectCard={(card) => {
                                if (!pinnedCard) setInspectedCard(card);
                            }}
                            onPinCard={handlePinCard}
                        />
                    </Col>

                    {/* RIGHT COLUMN: SEARCH POOL */}
                    <Col lg={5}>
                        <CardApi 
                            onAddCard={handleAddCard} 
                            onDeleteCard={handleDeleteCard}
                            cardList={[...mainDeck, ...extraDeck]}
                            onInspectCard={(card) => {
                                if (!pinnedCard) setInspectedCard(card);
                            }}
                            onPinCard={handlePinCard}
                        />
                    </Col>
                </Row>
            </Container>

            {/* AI CARD SUGGESTER MODAL */}
            <AiCardSuggester 
                show={showAiModal} 
                onHide={() => setShowAiModal(false)} 
                mainDeck={mainDeck} 
                extraDeck={extraDeck}
                onAddCard={handleAddCard} 
                onAutoBuildDeck={({ main, extra, name }) => {
                    dispatch(importYdkDeck({ main, extra, name }));
                    setShowAiModal(false);
                }}
            />

            {/* SAVE SUCCESS NOTIFICATION MODAL */}
            <Modal show={showSaveModal} onHide={() => setShowSaveModal(false)} centered contentClassName="md-modal">
                <Modal.Header closeButton className="border-info bg-dark">
                    <Modal.Title className="text-info terminal-font">SYSTEM_NOTIFICATION</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white text-center py-4">
                    <h5 className="terminal-font">DECK_SAVED_SUCCESSFULLY</h5>
                    <p className="text-muted small">Archived to erregeteygo cloud services.</p>
                </Modal.Body>
            </Modal>
        </div>
    );
}