import React, { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Container, Row, Col, Spinner, Button } from 'react-bootstrap';
import CustomDeck from "./CustomDeck"; 
import '../mdstyles.css';

export default function DeckProfileDetails() {
    const { deckId } = useParams();
    const [deck, setDeck] = useState(null);
    const [loading, setLoading] = useState(true);

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

    // --- YDK EXPORT ENGINE ---
    const handleExportYDK = () => {
        if (!deck) return;

        // Build the YDK string structure
        let ydkContent = "#created by ErreGeTe YGO\n#main\n";
        
        // Add Main Deck IDs (using id or passcode depending on your card object structure)
        deck.mainDeck?.forEach(card => {
            ydkContent += `${card.id}\n`;
        });

        ydkContent += "#extra\n";
        deck.extraDeck?.forEach(card => {
            ydkContent += `${card.id}\n`;
        });

        ydkContent += "!side\n";
        deck.sideDeck?.forEach(card => {
            ydkContent += `${card.id}\n`;
        });

        // Create the file download
        const blob = new Blob([ydkContent], { type: "text/plain" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        
        link.href = url;
        link.download = `${deck.title.replace(/\s+/g, '_') || 'deck'}.ydk`;
        document.body.appendChild(link);
        link.click();
        
        // Cleanup
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
    };

    if (loading) return (
        <div className="md-theme-bg min-vh-100 d-flex flex-column justify-content-center align-items-center">
            <Spinner animation="border" variant="info" />
            <h5 className="text-info mt-3" style={{fontFamily: 'Cascadia Mono'}}>SYNCHRONIZING_WITH_AZURE_DATABASE...</h5>
        </div>
    );

    if (!deck) return <div className="md-theme-bg text-danger p-5">ERROR: DECK_DATA_CORRUPTED_OR_MISSING</div>;

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5">
            <Container>
                <div className="md-panel p-4 mb-4 border-info">
                    <Row className="align-items-center">
                        <Col>
                            <h2 className="text-info m-0" style={{ fontFamily: 'Cascadia Mono' }}>
                                {deck.title?.toUpperCase() || "UNNAMED_DECK"}
                            </h2>
                            <p className="text-muted m-0 small">FILE_PATH: ROOT/DECKS/{deck.id}</p>
                        </Col>
                        <Col xs="auto" className="d-flex gap-2">
                            {/* THE EXPORT BUTTON */}
                            <Button onClick={handleExportYDK} className="md-btn-primary">
                                EXPORT_YDK
                            </Button>
                            
                            <Button as={Link} to="/profile" className="md-btn-outline">
                                BACK TO PROFILE
                            </Button>
                        </Col>
                    </Row>
                </div>

                <Row>
                    <Col md={12} className="md-panel p-4">
                        <div className="d-flex justify-content-between align-items-center mb-4">
                            <h5 className="text-white m-0" style={{letterSpacing: '1px'}}>
                                MAIN DECK ({deck.mainDeck?.length || 0}/60)
                            </h5>
                            <span className="text-info small terminal-font">STATUS: VERIFIED</span>
                        </div>
                        <div className="deck-scroll-container">
                            <CustomDeck 
                                mainDeck={deck.mainDeck} 
                                extraDeck={deck.extraDeck} 
                                sideDeck={deck.sideDeck}
                            />
                        </div>
                    </Col>
                </Row>
            </Container>
        </div>
    );
}