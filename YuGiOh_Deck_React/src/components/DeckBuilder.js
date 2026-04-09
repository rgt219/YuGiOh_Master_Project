import React, { useState, useEffect, useRef } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Button, Container, Row, Col, Modal, Form, Spinner } from 'react-bootstrap';
import { useSelector, useDispatch } from 'react-redux';
import { 
    addCardToDeck, 
    removeCardFromDeck, 
    updateDeckName, 
    importYdkDeck 
} from "../store/deckSlice";

import CardApi from "../components/CardApi";
import CustomDeck from "./CustomDeck";
import { deckList } from "../components/CardApi";
import '../mdstyles.css';

export default function DeckBuilder({ user }) {
    // --- REDUX UPLINK ---
    // We pull the state from our Redux store instead of local useState
    const mainDeck = useSelector((state) => state.deck.mainDeck);
    const extraDeck = useSelector((state) => state.deck.extraDeck);
    const deckName = useSelector((state) => state.deck.deckName);
    const dispatch = useDispatch();

    const [show, setShow] = useState(false);
    const [isHydrating, setIsHydrating] = useState(false);
    const fileInputRef = useRef(null);

    // --- YGOPRODECK HYDRATION ENGINE ---
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
                // Batch Fetch from YGOPRODeck
                const allIds = [...mainIds, ...extraIds].join(",");
                const response = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${allIds}`);
                const result = await response.json();
                
                if (!result.data) throw new Error("API_DATA_MISSING");

                const cardMap = {};
                result.data.forEach(card => {
                    cardMap[String(card.id)] = card;
                });

                // Hydrate and Flatten Images
                const hydratedMain = mainIds.map(id => {
                    const card = cardMap[id];
                    return card ? { ...card, image: card.card_images[0].image_url, instanceId: Math.random() } : null;
                }).filter(c => c !== null);

                const hydratedExtra = extraIds.map(id => {
                    const card = cardMap[id];
                    return card ? { ...card, image: card.card_images[0].image_url, instanceId: Math.random() } : null;
                }).filter(c => c !== null);

                // --- REDUX DISPATCH ---
                // We send the entire hydrated deck to the global store
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

    const triggerFileSelect = () => fileInputRef.current.click();

    // Redux Handlers
    const handleAddCard = (newCard) => {
        dispatch(addCardToDeck(newCard));
    };

    const deleteCard = (instanceId) => {
        dispatch(removeCardFromDeck(instanceId));
    };

    // Keep the legacy deckList sync if your other components still rely on it
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
                                onChange={(e) => dispatch(updateDeckName(e.target.value))} 
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
                                <CustomDeck 
                                    mainDeck={mainDeck} 
                                    extraDeck={extraDeck} 
                                    onDeleteCard={(id, inst) => deleteCard(inst)} 
                                />
                            </div>
                        </div>
                    </Col>
                    <Col md={5}>
                        <div className="md-panel p-4 bg-black bg-opacity-50 h-100">
                            <CardApi 
                                onAddCard={handleAddCard} 
                                onDeleteCard={(id, inst) => deleteCard(inst)} 
                                cardList={[...mainDeck, ...extraDeck]} 
                            />
                        </div>
                    </Col>
                </Row>
            </Container>

            <Modal show={show} onHide={() => setShow(false)} centered contentClassName="md-modal">
                <Modal.Header closeButton className="border-info bg-dark"><Modal.Title className="text-info terminal-font">SYSTEM_NOTIFICATION</Modal.Title></Modal.Header>
                <Modal.Body className="bg-dark text-white text-center py-4">
                    <h5 className="terminal-font">DECK_UPLOAD_COMPLETE</h5>
                    <p className="text-muted small">Archived to erregeteygo cloud services.</p>
                </Modal.Body>
            </Modal>
        </div>
    );
}