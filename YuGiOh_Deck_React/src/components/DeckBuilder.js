import React, { useState, useEffect }from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { Card, Button, Container, Row, Col, Modal } from 'react-bootstrap';
import CardApi from "../components/CardApi";
import InputGroup from 'react-bootstrap/InputGroup';
import Form from 'react-bootstrap/Form';
import CustomDeck from "./CustomDeck";
import { deckList } from "../components/CardApi";
import '../mdstyles.css';

export default function DeckBuilder({user})
{
    const [cardList, setCardList] = useState([]); // This is your active deck (objects)
    const [masterCards, setMasterCards] = useState([]); // This is the 12,000 card DB
    const [deckName, setDeckName] = useState('');
    const [show, setShow] = useState(false);
    const [mainDeck, setMainDeck] = useState([]);
    const [extraDeck, setExtraDeck] = useState([]);

    const handleTextareaChange = (event) => {
        setDeckName(event.target.value);
    };
    
    const handleAddCard = (newCard) => {
        // Check if it belongs in the Extra Deck
        if (newCard.isExtraDeck) {
            if (extraDeck.length >= 15) {
                alert("EXTRA_DECK_LIMIT_REACHED (MAX 15)");
                return;
            }
            // Add unique instanceId so we can have multiple copies of the same card
            setExtraDeck([...extraDeck, { ...newCard, instanceId: Math.random() }]);
        } 
        // Otherwise, it belongs in the Main Deck
        else {
            if (mainDeck.length >= 60) {
                alert("MAIN_DECK_LIMIT_REACHED (MAX 60)");
                return;
            }
            setMainDeck([...mainDeck, { ...newCard, instanceId: Math.random() }]);
        }
    };

    const deleteCard = (cardId) => {
        setMainDeck(prevCards => {
            const index = prevCards.findIndex(card => parseInt(card.id) === parseInt(cardId));
            if (index > -1) {
                const newCards = [...prevCards];
                newCards.splice(index, 1);
                
                // ALSO update your global deckList here if you must use it
                deckList.mainDeck = newCards; 
                
                return newCards; // This new reference triggers the UI update
            } else {
                console.log("cant delete card")
            }
            return prevCards;
        });

        setExtraDeck(prevCards => {
            const index = prevCards.findIndex(card => parseInt(card.id) === parseInt(cardId));
            if (index > -1) {
                const newCards = [...prevCards];
                newCards.splice(index, 1);
                
                // ALSO update your global deckList here if you must use it
                deckList.extraDeck = newCards; 
                
                return newCards; // This new reference triggers the UI update
            } else {
                console.log("cant delete card")
            }
            return prevCards;
        });
    }

    useEffect(() => {
        // Whenever cardList changes, force the global deckList to match it
        deckList.mainDeck = cardList;
        console.log("Global DeckList Synced:", deckList.mainDeck);
    }, [cardList]);

    const handleSave = async () => {
        try {
            if (!user || !user.id) {
                alert("LOG_IN_REQUIRED");
                return;
            }

            // CREATE A THIN PAYLOAD
            const payload = {
                id: String(Math.floor(Math.random() * 1000000) + 1),
                title: deckName || "NEW_DECKLIST",
                userId: String(user.id),
                // MAGIC STEP: Only send the ID strings, not the whole card object
                mainDeck: mainDeck.map(card => String(card.id)), 
                extraDeck: extraDeck.map(card => String(card.id)),
                sideDeck: []
            };

            console.log("TRANSMITTING_THIN_PAYLOAD:", payload);

            const response = await fetch("https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb", {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload), // Send the thin payload
            });

            if (response.ok) {
                setShow(true);
                console.log('Data saved successfully!');
            } else {
                console.error('Failed to save. Error code:', response.status);
            }
        } catch (error) {
            console.error('Error:', error);
        }
    };

    return (
        <div className="master-duel-theme py-5 mt-5">
            <Container fluid className="px-4">
                {/* Header Controls */}
                <Row className="mb-4">
                    <Col md={12} className="md-panel p-3 d-flex align-items-center justify-content-between">
                        <div className="d-flex align-items-center gap-3 w-50">
                            <h4 className="m-0 text-info" style={{fontFamily: 'Cascadia Mono'}}>DECK EDITOR</h4>
                            <Form.Control 
                                className="md-input"
                                placeholder="ENTER DECK NAME..."
                                value={deckName} 
                                onChange={(e) => setDeckName(e.target.value)} 
                            />
                        </div>
                        <Button className="md-btn-save" onClick={handleSave}>SAVE DECK</Button>
                    </Col>
                </Row>

                <Row className="g-4" style={{minHeight: '80vh'}}>
                    {/* Left Side: The Deck Gallery */}
                    <Col md={7} className="md-panel p-4">
                        <h5 className="text-muted mb-3">MAIN DECK ({cardList.length}/60)</h5>
                        <div className="deck-scroll-container">
                            <CustomDeck 
                                mainDeck={mainDeck} 
                                extraDeck={extraDeck} 
                                onDeleteCard={deleteCard} 
                            />
                        </div>
                    </Col>

                    {/* Right Side: Search and API */}
                    <Col md={5} className="md-panel p-4 bg-black bg-opacity-50">
                        <CardApi 
                            onAddCard={handleAddCard} 
                            onDeleteCard={deleteCard}
                            // You can pass both or just one for global context if needed
                            cardList={[...mainDeck, ...extraDeck]} 
                        />
                    </Col>
                </Row>
            </Container>

            <Modal show={show} onHide={() => setShow(false)} centered contentClassName="md-modal">
                <Modal.Header closeButton className="border-info">
                    <Modal.Title className="text-info">SYSTEM MESSAGE</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center py-4">
                    <h5>Deck "{deckName}" successfully archived to database.</h5>
                </Modal.Body>
            </Modal>
        </div>
    );
}