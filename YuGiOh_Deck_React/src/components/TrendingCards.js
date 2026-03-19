import React, { useEffect, useState } from 'react';
import { Card } from 'react-bootstrap';

export default function TrendingCards()  {
    const [trending, setTrending] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchStats = async () => {
            try {
                // 1. Fetch the Top 10 from YOUR .NET API
                const response = await fetch('https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api/Analytics/top-cards?limit=5');
                const stats = await response.json();

                // 2. Fetch the actual card details/images from the Public API
                // We join the IDs into a comma-separated string for a single request
                const ids = stats.map(s => s.cardId).join(',');
                const cardInfoRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${ids}`);
                const cardInfo = await cardInfoRes.json();

                // 3. Merge your usage counts with the external image data
                const mergedData = stats.map(stat => ({
                    ...stat,
                    imageUrl: cardInfo.data.find(info => info.id.toString() === stat.cardId)?.card_images[0].image_url_small,
                    name: cardInfo.data.find(info => info.id.toString() === stat.cardId)?.name
                }));

                setTrending(mergedData);
                setLoading(false);
            } catch (err) {
                console.error("Failed to load trending cards:", err);
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

