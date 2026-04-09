import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Row, Col, Modal, Form, Spinner } from 'react-bootstrap';
import CardApi from "../components/CardApi";
import CustomDeck from "./CustomDeck";
import { deckList } from "../components/CardApi";
import '../mdstyles.css';

export default function DeckBuilder({ user }) {
    const [deckName, setDeckName] = useState('');
    const [show, setShow] = useState(false);
    const [mainDeck, setMainDeck] = useState([]);
    const [extraDeck, setExtraDeck] = useState([]);
    const [isHydrating, setIsHydrating] = useState(false);
    
    const fileInputRef = useRef(null);

    // --- NEW YGOPRODECK HYDRATION ENGINE ---
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

            // 1. Parse IDs from file
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
                // 2. Batch Fetch from YGOPRODeck
                const allIds = [...mainIds, ...extraIds].join(",");
                const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${allIds}`);
                const result = await response.json();
                
                if (!result.data) throw new Error("API_DATA_MISSING");

                const cardMap = {};
                result.data.forEach(card => {
                    cardMap[String(card.id)] = card;
                });

                // 3. Map IDs back to full objects and FLATTEN the image URL
                const hydratedMain = mainIds.map(id => {
                    const card = cardMap[id];
                    if (!card) return null;
                    return {
                        ...card,
                        // Extract the image URL so CustomDeck can find it easily
                        image: card.card_images[0].image_url, 
                        instanceId: Math.random()
                    };
                }).filter(c => c !== null);

                const hydratedExtra = extraIds.map(id => {
                    const card = cardMap[id];
                    if (!card) return null;
                    return {
                        ...card,
                        image: card.card_images[0].image_url,
                        instanceId: Math.random()
                    };
                }).filter(c => c !== null);

                setMainDeck(hydratedMain);
                setExtraDeck(hydratedExtra);
                setDeckName(file.name.replace(".ydk", "").replace(/_/g, " ").toUpperCase());
                
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

    const triggerFileSelect = () => fileInputRef.current.click();

    // Standard Handlers
    const handleAddCard = (newCard) => {
        if (newCard.type?.includes("Fusion") || newCard.type?.includes("Synchro") || newCard.type?.includes("Link") || newCard.type?.includes("XYZ")) {
            if (extraDeck.length < 15) setExtraDeck([...extraDeck, { ...newCard, instanceId: Math.random() }]);
        } else {
            if (mainDeck.length < 60) setMainDeck([...mainDeck, { ...newCard, instanceId: Math.random() }]);
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
        if (!user?.id) return alert("LOG_IN_REQUIRED");
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
    };

    return (
        <div className="md-theme-bg py-5 mt-5" style={{minHeight: "100vh"}}>
            <input type="file" accept=".ydk" ref={fileInputRef} style={{ display: "none" }} onChange={handleImportYDK} />

            <Container fluid className="px-4">
                <Row className="mb-4">
                    <Col md={12} className="md-panel p-3 d-flex align-items-center justify-content-between border-info">
                        <div className="d-flex align-items-center gap-3 w-50">
                            <h4 className="m-0 text-info terminal-font">DECK_EDITOR_V2</h4>
                            <Form.Control 
                                className="md-input"
                                placeholder={isHydrating ? "SYNCHRONIZING..." : "IDENTIFY_DECK_NAME..."}
                                value={deckName} 
                                onChange={(e) => setDeckName(e.target.value)} 
                                disabled={isHydrating}
                            />
                        </div>
                        <div className="d-flex gap-2">
                            <Button className="md-btn-outline" onClick={triggerFileSelect} disabled={isHydrating}>
                                {isHydrating ? <Spinner size="sm" animation="border" /> : "IMPORT_YDK"}
                            </Button>
                            <Button className="md-btn-primary" onClick={handleSave}>ARCHIVE_DECK</Button>
                        </div>
                    </Col>
                </Row>

                <Row className="g-4">
                    <Col md={7}>
                        <div className="md-panel p-4 h-100">
                            <h5 className="text-white mb-3 terminal-font">MAIN_DECK [{mainDeck.length}/60]</h5>
                            <div className="deck-scroll-container">
                                <CustomDeck mainDeck={mainDeck} extraDeck={extraDeck} onDeleteCard={(id, inst) => deleteCard(inst)} />
                            </div>
                        </div>
                    </Col>
                    <Col md={5}>
                        <div className="md-panel p-4 bg-black bg-opacity-50 h-100">
                            <CardApi onAddCard={handleAddCard} onDeleteCard={(id, inst) => deleteCard(inst)} cardList={[...mainDeck, ...extraDeck]} />
                        </div>
                    </Col>
                </Row>
            </Container>

            <Modal show={show} onHide={() => setShow(false)} centered contentClassName="md-modal">
                <Modal.Header closeButton className="border-info bg-dark"><Modal.Title className="text-info terminal-font">SYSTEM_NOTIFICATION</Modal.Title></Modal.Header>
                <Modal.Body className="bg-dark text-white text-center py-4">
                    <h5 className="terminal-font">DECK_UPLOAD_COMPLETE</h5>
                </Modal.Body>
            </Modal>
        </div>
    );
}