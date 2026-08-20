import { useState, useEffect, useCallback } from 'react';
import { AZURE_BLOB_CONTAINER_URL } from '../constants/cardSearchConstants';

export function useCardSearch(filters) {
    const [rawCards, setRawCards] = useState([]);
    const [isLoading, setIsLoading] = useState(false);
    const [hasError, setHasError] = useState(false);

    const { selectedAttribute, selectedRace, selectedArchetype, selectedLevel, selectedLink, selectedScale } = filters;

    const fetchCards = useCallback(async () => {
        setIsLoading(true);
        setHasError(false);

        try {
            const params = new URLSearchParams();
            params.append("misc", "yes");
            
            if (selectedAttribute !== "ALL") params.append("attribute", selectedAttribute.toLowerCase());
            if (selectedRace && !selectedRace.startsWith("ALL")) params.append("race", selectedRace);
            if (selectedArchetype !== "ALL") params.append("archetype", selectedArchetype);
            if (selectedLevel !== "ALL") params.append("level", selectedLevel);
            if (selectedLink !== "ALL") params.append("link", selectedLink);
            if (selectedScale !== "ALL") params.append("scale", selectedScale);

            const url = `https://db.ygoprodeck.com/api/v7/cardinfo.php?${params.toString()}`;

            const genesysParams = new URLSearchParams(params.toString());
            genesysParams.append("format", "genesys");
            const genesysUrl = `https://db.ygoprodeck.com/api/v7/cardinfo.php?${genesysParams.toString()}`;

            const [response, genesysResponse] = await Promise.all([
                fetch(url),
                fetch(genesysUrl).catch(() => null) 
            ]);

            if (response.ok) {
                const result = await response.json();

                const genesysMap = {};
                if (genesysResponse && genesysResponse.ok) {
                    const genesysResult = await genesysResponse.json();
                    (genesysResult.data || []).forEach(c => {
                        genesysMap[c.id] = c.misc_info?.[0]?.genesys_points ?? 0;
                    });
                }
                
                const normalized = (result.data || []).map(c => {
                    const priceObj = c.card_prices?.[0] || {};
                    const banObj = c.banlist_info || {};
                    const miscObj = c.misc_info?.[0] || {};

                    const isLinkOrPendulum = (c.type || "").toLowerCase().includes("link") || 
                                             (c.type || "").toLowerCase().includes("pendulum");

                    const genesysPts = isLinkOrPendulum ? "N/A" : (genesysMap[c.id] ?? 0);

                    return {
                        id: c.id,
                        name: c.name || "Unknown Card",
                        type: c.type || "Normal",
                        desc: c.desc || "No card text available.",
                        level: c.level || c.rank || c.linkval || null,
                        atk: c.atk ?? null,
                        def: c.def ?? null,
                        race: c.race || "",
                        attribute: c.attribute || "",
                        image: `${AZURE_BLOB_CONTAINER_URL}/${c.id}.jpg`,
                        fallbackImage: c.card_images?.[0]?.image_url || "",
                        prices: {
                            tcgplayer: priceObj.tcgplayer_price ? `$${priceObj.tcgplayer_price}` : "N/A",
                            cardmarket: priceObj.cardmarket_price ? `€${priceObj.cardmarket_price}` : "N/A",
                            ebay: priceObj.ebay_price ? `$${priceObj.ebay_price}` : "N/A"
                        },
                        banlist: {
                            masterduel: banObj.ban_masterduel || "Unlimited",
                            tcg: banObj.ban_tcg || "Unlimited",
                            ocg: banObj.ban_ocg || "Unlimited"
                        },
                        isLinkOrPendulum,
                        genesysPoints: genesysPts,
                        cardSets: c.card_sets || [],
                    };
                });

                setRawCards(normalized);
            } else if (response.status === 400 || response.status === 404) {
                setRawCards([]);
            } else {
                setHasError(true);
            }
        } catch (err) {
            setHasError(true);
        } finally {
            setIsLoading(false);
        }
    }, [selectedAttribute, selectedRace, selectedArchetype, selectedLevel, selectedLink, selectedScale]);

    useEffect(() => {
        const timer = setTimeout(() => { fetchCards(); }, 300);
        return () => clearTimeout(timer);
    }, [fetchCards]);

    return { rawCards, isLoading, hasError, fetchCards };
}