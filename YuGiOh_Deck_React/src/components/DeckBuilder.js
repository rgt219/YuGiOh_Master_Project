import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Row, Col, Modal, Form } from 'react-bootstrap';
import CardApi from "../components/CardApi";
import CustomDeck from "./CustomDeck";
import { deckList } from "../components/CardApi";
import '../mdstyles.css';

export default function DeckBuilder({ user }) {
    const [cardList, setCardList] = useState([]); 
    const [masterCards, setMasterCards] = useState([]); // Database for hydration
    const [deckName, setDeckName] = useState('');
    const [show, setShow] = useState(false);
    const [mainDeck, setMainDeck] = useState([]);
    const [extraDeck, setExtraDeck] = useState([]);
    
    const fileInputRef = useRef(null);

    // 1. Fetch Master Database on Mount for YDK Hydration
    useEffect(() => {
        const fetchMasterDB = async () => {
            try {
                // Adjust this URL to your actual card data endpoint
                const response = await fetch("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/Cards");
                const data = await response.json();
                setMasterCards(data);
                console.log("MASTER_DB_LINK_ESTABLISHED:", data.length, "cards loaded.");
            } catch (error) {
                console.error("DATABASE_LINK_FAILURE:", error);
            }
        };
        fetchMasterDB();
    }, []);

    // 2. YDK Import Logic
    const handleImportYDK = (event) => {
        const file = event.target.files[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const content = e.target.result;
            const lines = content.split(/\r?\n/);
            
            let currentSection = "";
            const importedMain = [];
            const importedExtra = [];

            lines.forEach(line => {
                const trimmed = line.trim();
                if (trimmed === "#main") { currentSection = "main"; return; }
                if (trimmed === "#extra") { currentSection = "extra"; return; }
                if (trimmed === "!side") { currentSection = "side"; return; }
                if (trimmed.startsWith("#") || !trimmed || currentSection === "side") return;

                // Match ID against Master Database
                const cardData = masterCards.find(c => String(c.id) === trimmed);

                if (cardData) {
                    const hydratedCard = { ...cardData, instanceId: Math.random() };
                    if (currentSection === "main") importedMain.push(hydratedCard);
                    if (currentSection === "extra") importedExtra.push(hydratedCard);
                } else {
                    console.warn(`CARD_ID_${trimmed}_NOT_FOUND_IN_DB`);
                }
            });

            setMainDeck(importedMain);
            setExtraDeck(importedExtra);
            setDeckName(file.name.replace(".ydk", "").replace(/_/g, " ").toUpperCase());
            
            // Reset file input so same file can be imported twice if needed
            event.target.value = null;
        };
        reader.readAsText(file);
    };

    const triggerFileSelect = () => fileInputRef.current.click();

    const handleAddCard = (newCard) => {
        if (newCard.isExtraDeck) {
            if (extraDeck.length >= 15) {
                alert("EXTRA_DECK_LIMIT_REACHED");
                return;
            }
            setExtraDeck([...extraDeck, { ...newCard, instanceId: Math.random() }]);
        } else {
            if (mainDeck.length >= 60) {
                alert("MAIN_DECK_LIMIT_REACHED");
                return;
            }
            setMainDeck([...mainDeck, { ...newCard, instanceId: Math.random() }]);
        }
    };

    const deleteCard = (instanceId) => {
        setMainDeck(prev => prev.filter(card => card.instanceId !== instanceId));
        setExtraDeck(prev => prev.filter(card => card.instanceId !== instanceId));
    };

    useEffect(() => {
        deckList.mainDeck = mainDeck;
        deckList.extraDeck = extraDeck;
    }, [mainDeck, extraDeck]);

    const handleSave = async () => {
        try {
            if (!user?.id) {
                alert("LOG_IN_REQUIRED");
                return;
            }

            const payload = {
                id: String(Math.floor(Math.random() * 1000000) + 1),
                title: deckName || "NEW_DECKLIST",
                userId: String(user.id),
                mainDeck: mainDeck.map(card => String(card.id)), 
                extraDeck: extraDeck.map(card => String(card.id)),
                sideDeck: []
            };

            const response = await fetch("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (response.ok) setShow(true);
        } catch (error) {
            console.error('TRANSMISSION_ERROR:', error);
        }
    };

    return (
        <div className="md-theme-bg py-5 mt-5" style={{minHeight: "100vh"}}>
            <input 
                type="file" 
                accept=".ydk" 
                ref={fileInputRef} 
                style={{ display: "none" }} 
                onChange={handleImportYDK} 
            />

            <Container fluid className="px-4">
                {/* Header HUD */}
                <Row className="mb-4">
                    <Col md={12} className="md-panel p-3 d-flex align-items-center justify-content-between border-info">
                        <div className="d-flex align-items-center gap-3 w-50">
                            <h4 className="m-0 text-info terminal-font">DECK_EDITOR_V2</h4>
                            <Form.Control 
                                className="md-input"
                                placeholder="IDENTIFY_DECK_NAME..."
                                value={deckName} 
                                onChange={(e) => setDeckName(e.target.value)} 
                            />
                        </div>
                        <div className="d-flex gap-2">
                            <Button className="md-btn-outline" onClick={triggerFileSelect}>
                                IMPORT_YDK
                            </Button>
                            <Button className="md-btn-primary" onClick={handleSave}>
                                ARCHIVE_DECK
                            </Button>
                        </div>
                    </Col>
                </Row>

                <Row className="g-4">
                    {/* Left: Active Deck Construction */}
                    <Col md={7}>
                        <div className="md-panel p-4 h-100">
                            <div className="d-flex justify-content-between align-items-center mb-3">
                                <h5 className="text-white m-0 terminal-font">MAIN_DECK [{mainDeck.length}/60]</h5>
                                <span className="text-muted small">EXTRA_DECK: {extraDeck.length}/15</span>
                            </div>
                            <div className="deck-scroll-container">
                                <CustomDeck 
                                    mainDeck={mainDeck} 
                                    extraDeck={extraDeck} 
                                    onDeleteCard={(id, instanceId) => deleteCard(instanceId)} 
                                />
                            </div>
                        </div>
                    </Col>

                    {/* Right: Database Search */}
                    <Col md={5}>
                        <div className="md-panel p-4 bg-black bg-opacity-50 h-100">
                            <CardApi 
                                onAddCard={handleAddCard} 
                                onDeleteCard={(id, instanceId) => deleteCard(instanceId)}
                                cardList={[...mainDeck, ...extraDeck]} 
                            />
                        </div>
                    </Col>
                </Row>
            </Container>

            <Modal show={show} onHide={() => setShow(false)} centered contentClassName="md-modal">
                <Modal.Header closeButton className="border-info bg-dark text-white">
                    <Modal.Title className="text-info terminal-font">SYSTEM_NOTIFICATION</Modal.Title>
                </Modal.Header>
                <Modal.Body className="bg-dark text-white text-center py-4">
                    <h5 className="terminal-font">DECK "{deckName}" UPLOAD_COMPLETE</h5>
                    <p className="text-muted small">Data successfully archived to Azure Cosmos DB.</p>
                </Modal.Body>
            </Modal>
        </div>
    );
}