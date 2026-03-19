import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';

export default function TrendingCards()  {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
        try {
            const response = await fetch('https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Analytics/top-cards?limit=5');
            
            if (!response.ok) {
                throw new Error(`API Status: ${response.status}`);
            }

            const stats = await response.json();

            // 1. FLEXIBLE PROPERTY NAMES: Handle both 'cardId' and 'CardId'
            // 2. FILTER: Ensure we don't send undefined IDs to the public API
            const validStats = stats.filter(s => s.cardId || s.CardId);
            const ids = validStats.map(s => s.cardId || s.CardId).join(',');

            if (!ids) {
                setTrending([]);
                setLoading(false);
                return;
            }

            const cardInfoRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ids}`);
            const cardInfo = await cardInfoRes.json();

            const mergedData = validStats.map(stat => {
                const currentId = (stat.cardId || stat.CardId).toString();
                const apiMatch = cardInfo.data.find(info => info.id.toString() === currentId);

                return {
                    cardId: currentId,
                    usageCount: stat.usageCount || stat.TotalUsage, // Match C# property name
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
        <Card className="bg-dark text-white border-secondary mt-3">
            <Card.Header className="border-secondary">
                <h5 className="mb-0">🔥 Trending Cards</h5>
            </Card.Header>
            <Card.Body className="p-2">
                {trending.map(card => (
                    <div key={card.cardId} className="d-flex align-items-center mb-3 border-bottom border-secondary pb-2">
                        <img 
                            src={card.imageUrl} 
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
    );
};

