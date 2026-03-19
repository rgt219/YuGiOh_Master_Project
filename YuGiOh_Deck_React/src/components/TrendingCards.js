import React, { useEffect, useState } from 'react';

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
        <div className="trending-sidebar">
            <h3>Trending Cards</h3>
            {trending.map(card => (
                <div key={card.cardId} className="trending-item">
                    <img src={card.imageUrl} alt={card.name} style={{ width: '50px' }} />
                    <div className="card-info">
                        <p className="card-name">{card.name}</p>
                        <small>{card.usageCount} Decks</small>
                    </div>
                </div>
            ))}
        </div>
    );
};

