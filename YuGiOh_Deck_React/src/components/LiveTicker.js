import React, { useState, useEffect } from 'react';
import { Card, Badge } from 'react-bootstrap';
import { useSignalR } from './SignalRContext.js';

// Helper component to render a single ticker item with card images
const TickerItem = ({ activity }) => {
    const mainDeck = activity.mainDeck || [];
    const extraDeck = activity.extraDeck || [];

    // Extract first 2 unique main deck card IDs
    const uniqueMainIds = Array.from(new Set(mainDeck)).slice(0, 2);
    // Extract first extra deck card ID
    const extraId = extraDeck.length > 0 ? extraDeck[0] : null;

    const allDisplayIds = [...uniqueMainIds, ...(extraId ? [extraId] : [])];

    const [cardImages, setCardImages] = useState({});

    useEffect(() => {
        if (allDisplayIds.length === 0) return;

        let isMounted = true;
        const validIds = allDisplayIds.filter(id => id && id !== '0');

        if (validIds.length === 0) return;

        // Hydrate small image URLs from YGOProDeck
        fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${validIds.join(',')}`)
            .then(res => res.ok ? res.json() : null)
            .then(data => {
                if (isMounted && data?.data) {
                    const imgMap = {};
                    data.data.forEach(c => {
                        imgMap[c.id.toString()] = c.card_images?.[0]?.image_url_small || `https://images.ygoprodeck.com/images/cards_small/${c.id}.jpg`;
                    });
                    setCardImages(imgMap);
                }
            })
            .catch(() => {
                // Fallback direct image URLs
                if (isMounted) {
                    const fallbackMap = {};
                    validIds.forEach(id => {
                        fallbackMap[id] = `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`;
                    });
                    setCardImages(fallbackMap);
                }
            });

        return () => { isMounted = false; };
    }, [activity]);

    return (
        <li className="d-flex justify-content-between align-items-center py-2 px-3 border-bottom border-secondary border-opacity-25 md-ticker-row">
            {/* 👈 LEFT: Activity Message */}
            <div className="text-start pe-3">
                <span className="fw-bold" style={{ color: '#00f2ff' }}>
                    {activity.username || activity.Username || "Duelist"}
                </span>{" "}
                <span className="text-white-50">
                    {activity.action || activity.Action || "published"}
                </span>{" "}
                <span className="text-white italic fw-semibold">
                    "{activity.title || activity.Title || "New Deck"}"
                </span>
            </div>

            {/* 👉 RIGHT: Deck Stats & Card Thumbnails */}
            <div className="d-flex align-items-center gap-3 ms-auto text-end flex-shrink-0">
                {/* Deck Counts */}
                <div className="text-end small terminal-font">
                    <Badge bg="dark" className="border border-info text-info me-1 px-2 py-1">
                        MAIN: {mainDeck.length}
                    </Badge>
                    <Badge bg="dark" className="border border-warning text-warning px-2 py-1">
                        EXTRA: {extraDeck.length}
                    </Badge>
                </div>

                {/* First 2 Main + First Extra Card Thumbnails */}
                <div className="d-flex gap-1 align-items-center">
                    {/* First 2 Unique Main Deck Cards */}
                    {uniqueMainIds.map((id, idx) => (
                        <img
                            key={`main-${id}-${idx}`}
                            src={cardImages[id] || `https://images.ygoprodeck.com/images/cards_small/${id}.jpg`}
                            alt="Main Card"
                            title={`Main Card #${idx + 1}`}
                            className="rounded border border-info shadow-sm"
                            style={{ width: '28px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                            }}
                        />
                    ))}

                    {/* First Extra Deck Card (Highlighted with Warning/Gold Border) */}
                    {extraId && (
                        <img
                            key={`extra-${extraId}`}
                            src={cardImages[extraId] || `https://images.ygoprodeck.com/images/cards_small/${extraId}.jpg`}
                            alt="Extra Deck Card"
                            title="Extra Deck Boss"
                            className="rounded border border-warning shadow-sm"
                            style={{ width: '28px', height: '40px', objectFit: 'cover' }}
                            onError={(e) => {
                                e.target.onerror = null;
                                e.target.src = 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
                            }}
                        />
                    )}
                </div>
            </div>
        </li>
    );
};

const LiveTicker = () => {
    const { activities } = useSignalR();

    const displayActivities = (activities || []).slice(0, 5);

    return (
        <Card className="master-duel-card shadow-lg border-info border-opacity-30">
            <Card.Header className="master-duel-card-header bg-dark text-info d-flex justify-content-between align-items-center py-2 px-3">
                <h6 className="mb-0 fw-bold terminal-font" style={{ letterSpacing: '1px' }}>
                    📡 LIVE DUELIST ACTIVITY
                </h6>
                <span className="small text-white-50 terminal-font">REALTIME BROADCAST</span>
            </Card.Header>
            <Card.Body className="p-0 bg-black-gradient">
                <ul className="list-unstyled mb-0">
                    {displayActivities.length > 0 ? (
                        displayActivities.map((activity, idx) => (
                            <TickerItem key={idx} activity={activity} />
                        ))
                    ) : (
                        <div className="text-muted small p-3 text-center terminal-font">
                            Waiting for duelists to publish decklists...
                        </div>
                    )}
                </ul>
            </Card.Body>
        </Card>
    );
};

export default LiveTicker;