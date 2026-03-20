import React, { useEffect, useState } from 'react';
import { Card, Modal, Button, Badge } from 'react-bootstrap';

// --- (Optionally Import your Master Duel CSS if you have one central file) ---
// import './MasterDuelTheme.css'; 
// Or include these classes directly in your main CSS file for consistency.

export default function TrendingCards() {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showModal, setShowModal] = useState(false);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Fetch your Top 5 (Numeric IDs Only)
                const response = await fetch('https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Analytics/top-cards?limit=5');
                if (!response.ok) throw new Error(`API Status: ${response.status}`);
                const stats = await response.json();

                // 2. Filter & Clean IDs (Only keep numeric)
                const validStats = stats.filter(s => {
                    const id = (s.cardId || s.CardId)?.toString();
                    return id && /^\d+$/.test(id); 
                });
                const ids = validStats.map(s => s.cardId || s.CardId).join(',');

                if (!ids) {
                    console.warn("No valid numeric card IDs found.");
                    setTrending([]);
                    setLoading(false);
                    return;
                }

                // 3. Fetch from YGOPRODeck (Numeric IDs are guaranteed to work)
                const cardInfoRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ids}`);
                if (!cardInfoRes.ok) {
                    const errorText = await cardInfoRes.text();
                    throw new Error(`Public API Error: ${errorText}`);
                }
                const cardInfo = await cardInfoRes.json();

                // 4. Merge (IMPORTANT: Get ALL properties for the modal)
                const mergedData = validStats.map(stat => {
                    const currentId = (stat.cardId || stat.CardId).toString();
                    const apiMatch = cardInfo.data.find(info => info.id.toString() === currentId);

                    return {
                        cardId: currentId,
                        usageCount: stat.usageCount || stat.TotalUsage || 0,
                        imageUrl: apiMatch?.card_images?.[0]?.image_url || "/path/to/placeholder.png",
                        name: apiMatch?.name || "Unknown Card",
                        description: apiMatch?.desc || "No card text available.",
                        type: apiMatch?.type || "Unknown",
                        attribute: apiMatch?.attribute || null,
                        race: apiMatch?.race || null,
                        level: apiMatch?.level || null,
                        atk: apiMatch?.atk, 
                        def: apiMatch?.def
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

    const handleCardClick = (card) => {
        setSelectedCard(card);
        setShowModal(true);
    };

    if (loading) return <div className="text-white text-center mt-3 small">Loading Master Duel Data...</div>;

    return (
        <>
            {/* --- SIDEBAR CARD (MASTER DUEL THEME) --- */}
            <Card className="master-duel-card mt-3">
                <Card.Header className="master-duel-card-header">
                    <h6 className="mb-0 text-white fw-bold">🔥 Trending (Top Decks)</h6>
                </Card.Header>
                <Card.Body className="p-2 bg-black-gradient">
                    {trending.map(card => (
                        <div 
                            key={card.cardId} 
                            className="d-flex align-items-center mb-3 border-bottom border-master-duel pb-2 master-duel-list-item"
                            style={{ cursor: 'pointer' }}
                            onClick={() => handleCardClick(card)}
                        >
                            <img 
                                src={card.imageUrl} 
                                alt={card.name} 
                                style={{ width: '45px', borderRadius: '4px', border: '1px solid #3c444c' }} 
                                className="me-3"
                            />
                            <div style={{ fontSize: '0.85rem' }}>
                                <div className="fw-bold text-white text-truncate" style={{ maxWidth: '140px' }}>
                                    {card.name}
                                </div>
                                <div className="text-master-duel-cyan small">{card.usageCount} Decks</div>
                            </div>
                        </div>
                    ))}
                </Card.Body>
            </Card>

            {/* --- MASTER DUEL DETAIL MODAL --- */}
            <MasterDuelDetailModal 
                show={showModal} 
                onHide={() => setShowModal(false)} 
                card={selectedCard} 
            />
        </>
    );
}

// ==========================================================
// --- REUSABLE MASTER DUEL DETAIL MODAL COMPONENT ---
// ==========================================================
function MasterDuelDetailModal({ show, onHide, card }) {
    if (!card) return null;

    // A small helper to style attributes like they are in Master Duel
    const getAttributeColor = (attribute) => {
        const colors = {
            LIGHT: 'warning',
            DARK: 'secondary',
            DIVINE: 'info',
            defaults: 'dark'
        };
        return colors[attribute?.toUpperCase()] || colors.defaults;
    };

    return (
        <Modal 
            show={show} 
            onHide={onHide} 
            centered 
            size="lg" // Larger modal for Master Duel feel
            contentClassName="master-duel-modal"
        >
            <Modal.Header closeButton closeVariant="white" className="border-master-duel-blue">
                <Modal.Title className="text-white fw-bold">{card.name}</Modal.Title>
            </Modal.Header>
            <Modal.Body className="bg-black-gradient p-4">
                <div className="row">
                    {/* --- Card Image (Left Side) --- */}
                    <div className="col-md-5 text-center d-flex align-items-center justify-content-center">
                        <img 
                            src={card.imageUrl} // Use larger image here
                            alt={card.name}
                            className="img-fluid master-duel-detail-image mb-3"
                        />
                    </div>

                    {/* --- Card Details (Right Side) --- */}
                    <div className="col-md-7">
                        <div className="d-flex align-items-center mb-3">
                            <Badge bg="dark" className="me-2 text-uppercase fs-7 master-duel-label-badge">{card.type}</Badge>
                            {card.race && (
                                <Badge bg="dark" className="me-2 text-uppercase fs-7 master-duel-label-badge">{card.race}</Badge>
                            )}
                            {card.attribute && (
                                <Badge bg={getAttributeColor(card.attribute)} className="ms-auto text-uppercase fs-7 master-duel-label-badge">
                                    {card.attribute}
                                </Badge>
                            )}
                        </div>

                        {card.level && (
                            <div className="mb-3 text-start">
                                {/* Changed 'text-muted' to 'text-white' and added fw-bold */}
                                <span className="small text-white fw-bold me-2">Level / Rank:</span>
                                <span className="text-master-duel-cyan fw-bold">{card.level} ★</span>
                            </div>
                        )}

                        {typeof card.atk === 'number' && (
                            <div className="master-duel-stat-box px-3 py-1 d-flex align-items-center">
                                <span className="small text-white fw-bold me-2">ATK /</span>
                                <span className="text-white fw-bold me-3">{card.atk}</span>
                                
                                <span className="small text-white fw-bold me-2">DEF /</span>
                                <span className="text-white fw-bold">{card.def}</span>
                            </div>
                        )}

                        {/* --- Card Text (Master Duel Bordered Box) --- */}
                        <div className="text-start p-3 mt-4 master-duel-text-box">
                            {/* Changed 'text-muted' to 'text-white' for better visibility */}
                            <h6 className="small text-white fw-bold border-bottom border-master-duel-blue pb-1 mb-2">
                                Card Effect / Text
                            </h6>
                            <p className="text-white-50" style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
                                {card.description}
                            </p>
                        </div>
                    </div>
                </div>
            </Modal.Body>
            <Modal.Footer className="border-master-duel-blue">
                <Button variant="outline-light" onClick={onHide}>
                    Close
                </Button>
            </Modal.Footer>
        </Modal>
    );
}