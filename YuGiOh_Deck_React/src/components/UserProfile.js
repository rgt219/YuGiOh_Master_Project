import React, { useState, useEffect } from "react";
import { Container, Row, Col, Card, Button, Spinner } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import '../mdstyles.css';

export default function UserProfile({ user }) {
    const [userDecks, setUserDecks] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchAndHydrateDecks = async () => {
            if (!user || !user.id) return;

            try {
                // 1. Get raw decks from Azure
                const response = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb/user/${user.id}`);
                if (!response.ok) {
                    setUserDecks([]);
                    return;
                }
                const rawDecks = await response.json();

                // 2. GET OR DOWNLOAD CACHE
                let masterCards = [];
                const cachedData = sessionStorage.getItem("YGOCardCache");

                if (cachedData) {
                    masterCards = JSON.parse(cachedData);
                } else {
                    // If cache is empty, we MUST download it here too
                    const masterRes = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php');
                    const result = await masterRes.json();
                    
                    const userCardIds = new Set(rawDecks.flatMap(d => d.mainDeck || []));

                    masterCards = result.data.map(card => {
                        const isPriority = userCardIds.has(String(card.id));
                        
                        return {
                            id: card.id,
                            image: card.card_images[0].image_url_small,
                            // Only save the heavy text if the card is in a deck
                            name: isPriority ? card.name : undefined,
                            desc: isPriority ? card.desc : undefined, 
                            attribute: isPriority ? card.attribute : undefined,
                            level: isPriority ? card.level : undefined,
                            race: isPriority ? card.race : undefined,
                            type: isPriority ? card.type : undefined
                        };
                    });
                    
                    sessionStorage.setItem("YGOCardCache", JSON.stringify(masterCards));
                }

                // 3. HYDRATION
                const hydratedDecks = rawDecks.map(deck => ({
                    ...deck,
                    mainDeck: (deck.mainDeck || []).map(cardId => {
                        const match = masterCards.find(m => String(m.id) === String(cardId));
                        return match ? match : { image: "/images/card_back_placeholder.png" };
                    })
                }));

                setUserDecks(hydratedDecks);
            } catch (error) {
                console.error("DATABASE_LINK_FAILURE:", error);
            } finally {
                setLoading(false);
            }
        };

        fetchAndHydrateDecks();
    }, [user]);

    if (!user) return <div className="md-theme-bg text-info p-5">ACCESS_DENIED: PLEASE_LOGIN</div>;

    const handleDeleteDeck = async (deckId) => {
        if (!user?.id) return;

        if (!window.confirm("SYSTEM_CONFIRMATION: PURGE_ARCHIVED_DECK?")) return;

        try {
            const response = await fetch(`https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/mongodb/DeckListMongoDb/${deckId}/user/${user.id}`, {
                method: 'DELETE',
            });

            if (response.ok) {
                // This is the "React Way" to re-render:
                // Filter out the deck that matches the deleted ID
                setUserDecks(prevDecks => prevDecks.filter(deck => deck.id !== deckId));
                
                console.log("UI_SYNCHRONIZED: DECK_REMOVED");
            } else {
                console.error("DELETION_FAILED");
            }
        } catch (error) {
            console.error("NETWORK_ERROR", error);
        }
    };

    return (
        <div className="md-theme-bg min-vh-100 py-5 mt-5">
            <Container>
                {/* User Header HUD */}
                <div className="md-panel p-4 mb-4 border-info">
                    <Row className="align-items-center">
                        <Col xs="auto">
                            <div className="empty-avatar" style={{ width: '80px', height: '80px' }}></div>
                        </Col>
                        <Col>
                            <h2 className="text-info m-0" style={{ fontFamily: 'Cascadia Mono' }}>
                                {user.firstName?.toUpperCase()}_{user.lastName?.toUpperCase()}
                            </h2>
                            <p className=" m-0">RANK: DUELIST // ID: {user.id}</p>
                        </Col>
                        <Col xs="auto" className="text-end">
                            <div className="text-info">DECKS ARCHIVED: {userDecks.length}</div>
                        </Col>
                    </Row>
                </div>

                <h4 className="text-white mb-4" style={{ letterSpacing: '2px' }}>SAVED DECKLISTS</h4>

                {loading ? (
                    <div className="text-center text-info"><Spinner animation="border" /></div>
                ) : (
                    <Row className="g-4">
                        {userDecks.length > 0 ? (
                            userDecks.map((deck) => (
                                <Col key={deck.id} md={4}>
                                    <Card className="md-nav-card h-100">
                                        <Card.Body className="d-flex flex-column justify-content-between">
                                            <div>
                                                <h5 className="text-info mb-3" style={{ fontFamily: 'Cascadia Mono', letterSpacing: '1px' }}>
                                                    {deck.title?.toUpperCase()}
                                                </h5>
                                                
                                                {/* NEW: Master Duel Style Image Container */}
                                                <div className="md-card-img-container mb-3">
                                                    <img 
                                                        src={deck.mainDeck[0]?.image || "/images/card_back_placeholder.png"} 
                                                        alt="" 
                                                        className="md-card-hover-zoom"
                                                        onError={(e) => { e.target.src = "/images/card_back_placeholder.png"; }}
                                                    />
                                                </div>

                                                <p className="md-text-disabled small">
                                                    MAIN: {deck.mainDeck?.length || 0} | 
                                                    EXTRA: {deck.extraDeck?.length || 0}
                                                </p>
                                            </div>
                                            <div className="mt-3">
                                                <Button as={Link} to={`/deckprofiledetails/${deck.id}`} className="md-btn-outline w-100 mb-2">
                                                    VIEW DECK PROFILE
                                                </Button>
                                                <Button 
                                                    className="md-btn-delete w-100 mb-2" 
                                                    variant="outline-danger"
                                                    onClick={() => handleDeleteDeck(deck.id)}>
                                                    DELETE DECK
                                                </Button>
                                            </div>
                                        </Card.Body>
                                    </Card>
                                </Col>
                            ))
                        ) : (
                            <Col className="text-center py-5">
                                <p className="text-muted">NO_DECK_DATA_FOUND_IN_ARCHIVE</p>
                                <Button as={Link} to="/deckbuilder" className="md-btn-primary">INITIALIZE_DECK_BUILDER</Button>
                            </Col>
                        )}
                    </Row>
                )}
            </Container>
        </div>
    );
}