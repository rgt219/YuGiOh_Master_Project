import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Row, Col, Spinner, Button } from 'react-bootstrap';
import CustomDeck from "./CustomDeck"; 
import AiDeckCopywriter from "./AiDeckCopywriter";
import AiComboPlaybook from "./AiComboPlaybook";
import '../mdstyles.css';
import DeckPriceWidget from "./DeckPriceWidget";

export default function DeckProfileDetails() {
    const { deckId } = useParams();
    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);
    const [showCopywriterModal, setShowCopywriterModal] = useState(false);
    const [showPlaybookModal, setShowPlaybookModal] = useState(false);

    useEffect(() => {
        const loadDeckData = async () => {
            try {
                const res = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb/${deckId}`);
                if (!res.ok) throw new Error("DECK_NOT_FOUND");
                const hydratedData = await res.json();
                setDeck(hydratedData);
            } catch (error) {
                console.error("ARCHIVE_ACCESS_ERROR:", error);
            } finally {
                setLoading(false);
            }
        };
        loadDeckData();
    }, [deckId]);

    const handleExportYDK = () => {
        if (!deck) return;

        let ydkContent = "#created by ErreGeTe YGO\n#main\n";
        
        deck.mainDeck?.forEach(card => {
            const cardId = card.id || card.Id;
            if (cardId) ydkContent += `${cardId}\n`;
        });

        ydkContent += "#extra\n";
        deck.extraDeck?.forEach(card => {
            const cardId = card.id || card.Id;
            if (cardId) ydkContent += `${cardId}\n`;
        });

        ydkContent += "!side\n";
        deck.sideDeck?.forEach(card => {
            const cardId = card.id || card.Id;
            if (cardId) ydkContent += `${cardId}\n`;
        });

        const blob = new Blob([ydkContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        link.href = url;
        link.download = `${(deck.title || 'deck').replace(/\s+/g, '_')}.ydk`;
        document.body.appendChild(link);
        link.click();
        
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="md-theme-bg min-vh-100 d-flex flex-column justify-content-center align-items-center">
            <Spinner animation="border" variant="info" />
            <h5 className="text-info mt-3 terminal-font">SYNCHRONIZING_WITH_AZURE_DATABASE...</h5>
        </div>
    );

    if (!deck) return <div className="md-theme-bg text-danger p-5 terminal-font">ERROR: DECK_DATA_CORRUPTED_OR_MISSING</div>;

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5">
            <Container>
                {/* HEADER / ACTION BAR */}
                <div className="md-panel p-4 mb-4 border-info">
                    <Row className="align-items-center gy-3">
                        {/* DECK TITLE & METADATA */}
                        <Col lg={4} md={12}>
                            <h2 className="text-info m-0 terminal-font fw-bold" style={{ letterSpacing: '1px' }}>
                                {deck.title?.toUpperCase() || "UNNAMED_DECK"}
                            </h2>
                            <p className="text-muted m-0 small terminal-font">FILE_PATH: ROOT/DECKS/{deck.id}</p>
                        </Col>

                        {/* MASTER DUEL ACTION TOOLBAR */}
                        <Col lg={8} md={12} className="d-flex justify-content-lg-end justify-content-start align-items-stretch flex-wrap gap-2">
                            {/* AI DECK ARTICLE BUTTON */}
                            <Button 
                                variant="outline-info" 
                                className="terminal-font fw-bold px-3 py-2 d-inline-flex align-items-center justify-content-center"
                                onClick={() => setShowCopywriterModal(true)}
                                style={{ minHeight: '42px' }}
                            >
                                ✍️ DECK ARTICLE
                            </Button>

                            {/* AI COMBO PLAYBOOK BUTTON - GOLD */}
                            <Button 
                                variant="outline-warning" 
                                className="terminal-font fw-bold px-3 py-2 d-inline-flex align-items-center justify-content-center"
                                onClick={() => setShowPlaybookModal(true)}
                                style={{ minHeight: '42px' }}
                            >
                                🎮 COMBO PLAYBOOK
                            </Button>

                            {/* EXPORT YDK BUTTON - GREEN / DOWNLOAD */}
                            <Button 
                                onClick={handleExportYDK} 
                                variant="outline-success" 
                                className="terminal-font fw-bold px-3 py-2 d-inline-flex align-items-center justify-content-center"
                                style={{ minHeight: '42px' }}
                            >
                                📥 EXPORT YDK
                            </Button>

                            {/* BACK BUTTON - CYAN TERMINAL */}
                            <Button 
                                as={Link} 
                                to="/profile" 
                                variant="outline-info" 
                                className="terminal-font fw-bold px-3 py-2 d-inline-flex align-items-center justify-content-center"
                                style={{ minHeight: '42px', textDecoration: 'none' }}
                            >
                                ⬅️ BACK
                            </Button>
                        </Col>
                    </Row>
                </div>

                {/* DECK VIEWER CONTAINER */}
                <Row>
                    <Col md={12} className="md-panel p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <span className="text-info small terminal-font">STATUS: VERIFIED</span>
                        </div>
                        <div className="deck-scroll-container">
                            <CustomDeck 
                                mainDeck={deck.mainDeck} 
                                extraDeck={deck.extraDeck} 
                                sideDeck={deck.sideDeck}
                                cardsPerRow={10}
                            />
                        </div>
                    </Col>
                </Row>
                <Row className="mb-4">
                    <Col md={12}>
                        <DeckPriceWidget 
                            mainDeck={deck.mainDeck} 
                            extraDeck={deck.extraDeck} 
                            sideDeck={deck.sideDeck} 
                        />
                    </Col>
                </Row>
            </Container>

            {/* MODALS */}
            <AiDeckCopywriter
                show={showCopywriterModal}
                onHide={() => setShowCopywriterModal(false)}
                deckName={deck.title}
                mainDeck={deck.mainDeck}
                extraDeck={deck.extraDeck}
            />
            <AiComboPlaybook
                show={showPlaybookModal}
                onHide={() => setShowPlaybookModal(false)}
                deckName={deck.title}
                mainDeck={deck.mainDeck}
                extraDeck={deck.extraDeck}
            />
        </div>
    );
}