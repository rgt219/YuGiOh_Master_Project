import React, { useEffect, useState } from 'react';
import { API_URLS } from "../config";
import { Card, Modal, Button } from 'react-bootstrap';

export default function TrendingCards()  {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const handleCardClick = (card) => {
        setSelectedCard(card);
        setShowModal(true);
    };

    useEffect(() => {
        const fetchStats = async () => {
            try {
                const response = await fetch('https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Analytics/top-cards?limit=5');
                
                if (!response.ok) {
                    throw new Error(`API Status: ${response.status}`);
                }

                const stats = await response.json();

                // 1. CLEANING STEP: Only keep numeric IDs
                // This regex checks if the ID is just digits. 
                // It will filter out "card-001", nulls, or empty strings.
                const validStats = stats.filter(s => {
                    const id = (s.cardId || s.CardId)?.toString();
                    return id && /^\d+$/.test(id); 
                });

                const ids = validStats.map(s => s.cardId || s.CardId).join(',');

                // 2. SAFETY CHECK: If no numeric IDs exist, don't call the public API
                if (!ids) {
                    console.warn("No valid numeric card IDs found in analytics.");
                    setTrending([]);
                    setLoading(false);
                    return;
                }

                const cardInfoRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ids}`);
                
                if (!cardInfoRes.ok) {
                    const errorBody = await cardInfoRes.text();
                    throw new Error(`Public API Error: ${errorBody}`);
                }

                const cardInfo = await cardInfoRes.json();

                // 3. MERGE
                const mergedData = validStats.map(stat => {
                    const currentId = (stat.cardId || stat.CardId).toString();
                    const apiMatch = cardInfo.data.find(info => info.id.toString() === currentId);

                    return {
                        cardId: currentId,
                        usageCount: stat.usageCount || stat.TotalUsage || 0,
                        imageUrl: apiMatch?.card_images[0].image_url_small,
                        name: apiMatch?.name || "Unknown Card"
                    };
                });

                setTrending(mergedData);
                setLoading(false);
            } catch (err) {
                console.error("Fetch Error:", err);
                setLoading(false);
            }
        };

        fetchStats();
    }, []);

    if (loading) return <div>Loading Trends...</div>;

    return (
        <>
            <Card className="bg-dark text-white border-secondary mt-3">
                <Card.Header className="border-secondary">
                    <h5 className="mb-0">🔥 Trending Cards</h5>
                </Card.Header>
                <Card.Body className="p-2">
                    {trending.map(card => (
                        <div 
                            key={card.cardId} 
                            className="d-flex align-items-center mb-3 border-bottom border-secondary pb-2"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleCardClick(card)}
                        >
                            <img 
                                src={card.card_images[0].image_url_small} 
                                alt={card.name} 
                                style={{ width: '45px', borderRadius: '4px' }} 
                                className="me-3"
                            />
                            <div style={{ fontSize: '0.85rem' }}>
                                <div className="fw-bold text-truncate" style={{ maxWidth: '140px' }}>
                                    {card.name}
                                </div>
                                <div className="text-muted small">{card.usageCount} Decks</div>
                            </div>
                        </div>
                    ))}
                </Card.Body>
            </Card>

            {/* --- CARD DETAIL MODAL --- */}
            <Modal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                centered 
                contentClassName="bg-dark text-white border-secondary"
            >
                <Modal.Header closeButton closeVariant="white" className="border-secondary">
                    <Modal.Title>{selectedCard?.name}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="text-center">
                    <img 
                        src={selectedCard?.imageUrl?.replace('small', 'main')} // Use larger image for modal
                        alt={selectedCard?.name}
                        className="img-fluid mb-3"
                        style={{ maxHeight: '400px', borderRadius: '8px' }}
                    />
                    <div className="text-start p-2" style={{ backgroundColor: '#212529', borderRadius: '5px' }}>
                        <p className="small mb-0">{selectedCard?.desc || "No description available."}</p>
                    </div>
                </Modal.Body>
                <Modal.Footer className="border-secondary">
                    <Button variant="secondary" onClick={() => setShowModal(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

