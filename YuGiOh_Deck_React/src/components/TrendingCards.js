import React, { useEffect, useState } from 'react';
import { Card, Modal, Button, Badge, OverlayTrigger, Tooltip } from 'react-bootstrap';

// --- (Optionally Import your Master Duel CSS if you have one central file) ---
// import './MasterDuelTheme.css'; 
// Or include these classes directly in your main CSS file for consistency.

export default function TrendingCards() {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedCard, setSelectedCard] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [hotTech, setHotTech] = useState([]); // Add this line
    const [metaHealth, setMetaHealth] = useState();

    useEffect(() => {
        const fetchAllSidebarData = async () => {
            try {
                const baseUrl = 'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Analytics';

                // 1. Fire off both API calls at the same time
                const [trendingRes, hotTechRes] = await Promise.all([
                    fetch(`${baseUrl}/top-cards?limit=5`),
                    fetch(`${baseUrl}/rising-tech`) // Your new .NET endpoint
                ]);

                const trendingData = await trendingRes.json();
                const hotTechData = await hotTechRes.json();

                const healthRes = await fetch(`${baseUrl}/meta-health`);
                const healthData = await healthRes.json();
                setMetaHealth(healthData);

                // 2. Helper function to get card info from YGOPRODeck
                const getEnhancedData = async (stats) => {
                    const validStats = stats.filter(s => {
                        const id = (s.cardId || s.CardId)?.toString();
                        return id && /^\d+$/.test(id);
                    });
                    const ids = validStats.map(s => s.cardId || s.CardId).join(',');
                    
                    if (!ids) return [];

                    const infoRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ids}`);
                    const infoJson = await infoRes.json();

                    return validStats.map(stat => {
                        const currentId = (stat.cardId || stat.CardId).toString();
                        const apiMatch = infoJson.data.find(info => info.id.toString() === currentId);
                        return {
                            cardId: currentId,
                            usageCount: stat.totalUsage ?? stat.TotalUsage ?? stat.usageCount ?? 0,
                            name: apiMatch?.name || "Unknown Card",
                            imageUrl: apiMatch?.card_images?.[0]?.image_url,
                            description: apiMatch?.desc,
                            type: apiMatch?.type,
                            race: apiMatch?.race,
                            attribute: apiMatch?.attribute,
                            level: apiMatch?.level,
                            atk: apiMatch?.atk,
                            def: apiMatch?.def
                        };
                    });
                };

                // 3. Process both lists
                const [finalTrending, finalHotTech] = await Promise.all([
                    getEnhancedData(trendingData),
                    getEnhancedData(hotTechData)
                ]);

                setTrending(finalTrending);
                setHotTech(finalHotTech);
                setLoading(false);
            } catch (err) {
                console.error("Sidebar Load Error:", err);
                setLoading(false);
            }
        };

        fetchAllSidebarData();
    }, []);

    const handleCardClick = (card) => {
        setSelectedCard(card);
        setShowModal(true);
    };

    if (loading) return <div className="text-white text-center mt-3 small">Loading Master Duel Data...</div>;

    return (
        <>
            {/* Main Sidebar Container */}
            <div className="d-flex flex-column gap-4">
                {metaHealth && <MetaHealthGauge data={metaHealth} />}
                {/* --- SECTION 1: TRENDING (Existing) --- */}
                <Card className="master-duel-card">
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

                {/* --- SECTION 2: HOT TECH (The New Feature) --- */}
                <Card className="master-duel-card border-hot">
                    <Card.Header className="master-duel-card-header d-flex justify-content-between align-items-center">
                        <h6 className="mb-0 text-white fw-bold">🚀 Rising Tech</h6>
                        <Badge bg="danger" style={{ fontSize: '0.65rem' }}>HOT</Badge>
                    </Card.Header>
                    <Card.Body className="p-2 bg-black-gradient">
                        {/* Assuming you created a 'hotTech' state variable similarly to 'trending' */}
                        {hotTech && hotTech.length > 0 ? hotTech.map(card => (
                            <div 
                                key={`hot-${card.cardId}`} 
                                className="d-flex align-items-center mb-2 p-2 master-duel-list-item rounded"
                                style={{ cursor: 'pointer' }}
                                onClick={() => handleCardClick(card)}
                            >
                                <span className="text-hot-orange fw-bold me-3" style={{ fontSize: '1.1rem' }}>▲</span>
                                <div className="text-white small fw-bold text-truncate">{card.name}</div>
                            </div>
                        )) : (
                            <div className="text-muted small p-2">Monitoring Meta shifts...</div>
                        )}
                    </Card.Body>
                </Card>

            </div>

            {/* --- MASTER DUEL DETAIL MODAL (Shared by both sections) --- */}
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

// Add this at the bottom of TrendingCards.js
function MetaHealthGauge({ data }) {
    if (!data) return null;

    const { score, status, topCard } = data;

    const getGaugeColor = (s) => {
        if (s > 75) return '#00f2ff'; 
        if (s > 40) return '#ffcc00'; 
        return '#ff0055';            
    };

    const renderTooltip = (props) => (
        <Tooltip id="meta-tooltip" {...props} className="master-duel-tooltip">
            {score < 50 
                ? `High concentration of "${topCard}" detected.` 
                : `Healthy variety! "${topCard}" is the current lead.`}
        </Tooltip>
    );

    return (
        <OverlayTrigger placement="top" delay={{ show: 250, hide: 400 }} overlay={renderTooltip}>
            <Card className="master-duel-card mb-0" style={{ cursor: 'help' }}>
                <Card.Body className="p-3 bg-black-gradient text-center">
                    <h6 className="text-white-50 small fw-bold text-uppercase mb-3" style={{ letterSpacing: '1px' }}>
                        Format Health
                    </h6>
                    
                    <div className="position-relative mx-auto" style={{ width: '120px', height: '65px', overflow: 'hidden' }}>
                        <div className="position-absolute w-100 border border-secondary border-5 rounded-circle" 
                             style={{ height: '120px', opacity: 0.1, top: 0 }}></div>
                        
                        <div 
                            className="position-absolute w-100 rounded-circle" // Removed 'border' and 'border-5' classes
                            style={{ 
                                height: '120px', 
                                top: 0,
                                borderStyle: 'solid',      // Added this
                                borderWidth: '6px',        // Increased slightly for "pop"
                                borderColor: getGaugeColor(score),
                                transform: `rotate(${180 + (score * 1.8)}deg)`,
                                transition: 'transform 1.5s cubic-bezier(0.4, 0, 0.2, 1)',
                                borderLeftColor: 'transparent',
                                borderBottomColor: 'transparent',
                                // Optional: Add a subtle glow to match Master Duel's neon style
                                boxShadow: `0 0 8px ${getGaugeColor(score)}44`, 
                                zIndex: 2
                            }}
                        ></div>
                    </div>

                    <div className="mt-2">
                        <span className="fs-4 fw-bold text-white">{score}%</span>
                        <div className="small fw-bold" style={{ color: getGaugeColor(score), fontSize: '0.7rem' }}>
                            {status?.toUpperCase()}
                        </div>
                    </div>
                </Card.Body>
            </Card>
        </OverlayTrigger>
    );
}