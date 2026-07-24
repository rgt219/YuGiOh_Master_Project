import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Row, Col, Modal, Form, Spinner, OverlayTrigger, Tooltip } from 'react-bootstrap';
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
import { deckList } from "../components/CardApi";
import '../mdstyles.css';

export default function DeckBuilder({ user }) {
    const mainDeck = useSelector((state) => state.deck.mainDeck);
    const extraDeck = useSelector((state) => state.deck.extraDeck);
    const deckName = useSelector((state) => state.deck.deckName);
    const dispatch = useDispatch();

    const [show, setShow] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const fileInputRef = useRef(null);

    const handleImportYDK = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = async (e) => {
            setIsHydrating(true);
            const content = e.target.result;
            const lines = content.split(/\r?\n/);
            
            let currentSection = "";
            const mainIds = [];
            const extraIds = [];

            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed === "#main") { currentSection = "main"; return; }
                if (trimmed === "#extra") { currentSection = "extra"; return; }
                if (trimmed === "!side") { currentSection = "side"; return; }
                if (trimmed.startsWith("#") || !trimmed || currentSection === "side") return;

                if (currentSection === "main") mainIds.push(trimmed);
                if (currentSection === "extra") extraIds.push(trimmed);
            });

            try {
                const allIds = [...mainIds, ...extraIds].join(",");
                const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${allIds}`);
                const result = await response.json();
                
                if (!result.data) throw new Error("API_DATA_MISSING");

                const cardMap = {};
                result.data.forEach(card => {
                    cardMap[String(card.id)] = card;
                });

                const cardCounts = {};

                const hydratedMain = [];
                mainIds.forEach(id => {
                    const count = cardCounts[id] || 0;
                    if (count < 3) {
                        const card = cardMap[id];
                        if (card) {
                            hydratedMain.push({ 
                                ...card, 
                                image: card.card_images[0].image_url, 
                                instanceId: Math.random() 
                            });
                            cardCounts[id] = count + 1;
                        }
                    }
                });

                const hydratedExtra = [];
                extraIds.forEach(id => {
                    const count = cardCounts[id] || 0;
                    if (count < 3) {
                        const card = cardMap[id];
                        if (card) {
                            hydratedExtra.push({ 
                                ...card, 
                                image: card.card_images[0].image_url, 
                                instanceId: Math.random() 
                            });
                            cardCounts[id] = count + 1;
                        }
                    }
                });

                dispatch(importYdkDeck({
                    main: hydratedMain,
                    extra: hydratedExtra,
                    name: file.name.replace(".ydk", "").replace(/_/g, " ").toUpperCase()
                }));
                
            } catch (error) {
                console.error("YGOPRODECK_UPLINK_ERROR:", error);
                alert("EXTERNAL_DATABASE_CONNECTION_ERROR");
            } finally {
                setIsHydrating(false);
                event.target.value = null;
            }
        };
        reader.readAsText(file);
    };

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

    const handleClearDeck = () => {
        if (mainDeck.length === 0 && extraDeck.length === 0 && !deckName) {
            return;
        }

        if (window.confirm("SYSTEM_WARNING: Are you sure you want to clear all cards and the deck name?")) {
            dispatch(clearDeck());
        }
    };

    const triggerFileSelect = () => fileInputRef.current.click();

    const handleAddCard = (newCard) => {
        const cardId = String(newCard.id || newCard.Id);
        
        const existingCount = [...mainDeck, ...extraDeck].filter(
            (card) => String(card.id || card.Id) === cardId
        ).length;

        if (existingCount >= 3) {
            alert(`DECK_RULE_VIOLATION: Maximum 3 copies of "${newCard.name || 'this card'}" allowed.`);
            return;
        }

        dispatch(addCardToDeck(newCard));
    };

    const deleteCard = (id, instanceId) => {
        if (instanceId) {
            dispatch(removeCardFromDeck(instanceId));
        } else if (id) {
            const cardIdStr = String(id);
            const targetCard = [...mainDeck, ...extraDeck]
                .slice()
                .reverse()
                .find(c => String(c.id || c.Id) === cardIdStr);
            
            if (targetCard?.instanceId) {
                dispatch(removeCardFromDeck(targetCard.instanceId));
            }
        }
    };

    useEffect(() => {
        deckList.mainDeck = mainDeck;
        deckList.extraDeck = extraDeck;
    }, [mainDeck, extraDeck]);

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
            if (response.ok) setShow(true);
        } catch (err) {
            console.error("SAVE_ERROR:", err);
        }
    };

    return (
        <div className="md-theme-bg py-5 mt-5" style={{ minHeight: "100vh" }}>
            <input type="file" accept=".ydk" ref={fileInputRef} style={{ display: "none" }} onChange={handleImportYDK} />

            <Container fluid className="px-4">
                {/* TOOLBAR */}
                <Row className="mb-4">
                    <Col md={12} className="md-panel p-3 border-info">
                        <div className="d-flex flex-column flex-lg-row align-items-lg-center justify-content-between gap-3">
                            
                            {/* Left Section: Title & Deck Name Input */}
                            <div className="d-flex align-items-center gap-3 flex-grow-1">
                                <h4 className="m-0 text-info terminal-font text-nowrap">DECK_EDITOR_V2</h4>
                                <Form.Control 
                                    className="md-input flex-grow-1"
                                    placeholder={isHydrating ? "SYNCHRONIZING..." : "ENTER_DECK_NAME..."}
                                    value={deckName} 
                                    onChange={(e) => dispatch(updateDeckName(e.target.value))} 
                                    disabled={isHydrating}
                                    style={{ maxWidth: '400px' }}
                                />
                            </div>

                            {/* Right Section: Grouped Toolbar Actions */}
                            <div className="d-flex align-items-center gap-2 flex-wrap">
                                {/* File Tools */}
                                <div className="d-flex gap-2">
                                    <Button className="md-btn-outline text-nowrap" onClick={triggerFileSelect} disabled={isHydrating}>
                                        {isHydrating ? <Spinner size="sm" animation="border" /> : "IMPORT YDK"}
                                    </Button>
                                    <Button className="md-btn-outline text-nowrap" onClick={handleExportYDK}>
                                        EXPORT YDK
                                    </Button>
                                </div>

                                <div className="vr bg-info opacity-25 d-none d-sm-block mx-1" style={{ height: '24px' }}></div>

                                {/* Reset Tool */}
                                <Button variant="outline-danger" className="terminal-font text-nowrap px-3" onClick={handleClearDeck}>
                                    CLEAR
                                </Button>

                                <div className="vr bg-info opacity-25 d-none d-sm-block mx-1" style={{ height: '24px' }}></div>

                                {/* 🚀 GREEN SAVE DECK BUTTON */}
                                {!user ? (
                                    <OverlayTrigger
                                        placement="top"
                                        overlay={<Tooltip id="archive-disabled-tooltip">Must be logged in to save</Tooltip>}
                                    >
                                        <span className="d-inline-block">
                                            <Button variant="success" className="text-nowrap fw-bold" disabled style={{ pointerEvents: 'none' }}>
                                                SAVE DECK
                                            </Button>
                                        </span>
                                    </OverlayTrigger>
                                ) : (
                                    <Button 
                                        variant="success"
                                        className="text-nowrap fw-bold" 
                                        onClick={handleSave} 
                                        disabled={isHydrating}
                                    >
                                        SAVE DECK
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Col>
                </Row>

                <Row className="g-4">
                    <Col md={7}>
                        <div className="md-panel p-4 h-100">
                            <h5 className="text-white mb-3 terminal-font">MAIN_DECK [{mainDeck.length}/60]</h5>
                            <div className="deck-scroll-container">
                                <CustomDeck 
                                    mainDeck={mainDeck} 
                                    extraDeck={extraDeck} 
                                    onDeleteCard={(id, inst) => deleteCard(id, inst)} 
                                />
                            </div>
                        </div>
                    </Col>
                    <Col md={5}>
                        <div className="md-panel p-4 bg-black bg-opacity-50 h-100">
                            <CardApi 
                                onAddCard={handleAddCard} 
                                onDeleteCard={(id, inst) => deleteCard(id, inst)} 
                                cardList={[...mainDeck, ...extraDeck]} 
                            />
                        </div>
                    </Col>
                </Row>
            </Container>

            <Modal show={show} onHide={() => setShow(false)} centered contentClassName="md-modal">
                <Modal.Header closeButton className="border-info bg-dark">
                    <Modal.Title className="text-info terminal-font">SYSTEM_NOTIFICATION</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white text-center py-4">
                    <h5 className="terminal-font">DECK_UPLOAD_COMPLETE</h5>
                    <p className="text-muted small">Archived to erregeteygo cloud services.</p>
                </Modal.Body>
            </Modal>
        </div>
    );
}