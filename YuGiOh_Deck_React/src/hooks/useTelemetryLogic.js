import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { MARKET_API } from '@/utils/constants';

export default function useCardTelemetryLogic(setName, cardName) {
    const decodedSetName = decodeURIComponent(setName);
    const decodedCardName = decodeURIComponent(cardName);
    const router = useRouter();
    const searchParams = useSearchParams();

    const rawProductId = searchParams.get('id') || searchParams.get('productId');
    const tcgProductId = rawProductId ? parseInt(rawProductId, 10) : null;
    const rawKonamiId = searchParams.get('konamiId');
    const selectedRarity = searchParams.get('rarity') || null;

    const [cardDetails, setCardDetails] = useState(null);
    const [comprehensiveAnalytics, setComprehensiveAnalytics] = useState(null);
    const [printingsMap, setPrintingsMap] = useState({});
    const [selectedSet, setSelectedSet] = useState(decodedSetName);
    const [loading, setLoading] = useState(true);
    const [resolvedKonamiId, setResolvedKonamiId] = useState(rawKonamiId || null);
    const [rarityToProductIdMap, setRarityToProductIdMap] = useState({});

    useEffect(() => {
        async function fetchCardDetails() {
            try {
                let lookupId = rawKonamiId;
                if (!lookupId && decodedCardName) {
                    const cleanName = decodedCardName.replace(/\s*\(.*?\)\s*/g, '').trim();
                    const searchRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(cleanName)}`);
                    const searchJson = await searchRes.json();
                    if (searchJson?.data?.[0]) lookupId = searchJson.data[0].id.toString();
                }

                if (lookupId) {
                    setResolvedKonamiId(lookupId);
                    const ygoRes = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${lookupId}`);
                    const ygoJson = await ygoRes.json();
                    
                    if (ygoJson?.data?.[0]) {
                        const cardData = ygoJson.data[0];
                        setCardDetails(cardData);

                        const grouped = {};
                        (cardData.card_sets || []).forEach(printing => {
                            const sName = printing.set_name;
                            if (!grouped[sName]) grouped[sName] = [];
                            grouped[sName].push(printing);
                        });
                        setPrintingsMap(grouped);

                        let activeSet = selectedSet;
                        if (!grouped[activeSet]) {
                            activeSet = Object.keys(grouped)[0] || decodedSetName;
                            setSelectedSet(activeSet);
                        }
                    }
                }
            } catch (err) {
                console.error("Failed to load card details:", err);
            } finally {
                setLoading(false);
            }
        }
        fetchCardDetails();
    }, [rawKonamiId, decodedCardName]); 

    useEffect(() => {
        if (!resolvedKonamiId) return;
        async function fetchComprehensiveAnalytics() {
            try {
                const res = await fetch(`${MARKET_API}/api/market/${resolvedKonamiId}/comprehensive-analytics`);
                if (res.ok) setComprehensiveAnalytics(await res.json());
                else setComprehensiveAnalytics(null);
            } catch (err) {
                console.error("Failed to load comprehensive analytics:", err);
                setComprehensiveAnalytics(null);
            }
        }
        fetchComprehensiveAnalytics();
    }, [resolvedKonamiId]);

    useEffect(() => {
        async function fetchSetProductIds() {
            if (!selectedSet || !decodedCardName) return;
            try {
                const res = await fetch(`${MARKET_API}/api/market/sets/${encodeURIComponent(selectedSet)}/cards`);
                if (res.ok) {
                    const setCards = await res.json();
                    const cleanBaseName = decodedCardName.replace(/\s*\(.*?\)\s*/g, '').trim().toLowerCase();
                    const cardVariants = setCards.filter(c => 
                        c.cardName.toLowerCase() === cleanBaseName ||
                        c.cardName.toLowerCase().startsWith(cleanBaseName + " ") ||
                        c.cardName.toLowerCase().startsWith(cleanBaseName + " -") ||
                        c.cardName.toLowerCase().includes(cleanBaseName)
                    );
                    const newMap = {};
                    cardVariants.forEach(v => { newMap[v.rarity.toLowerCase()] = v.productId; });
                    setRarityToProductIdMap(newMap);
                }
            } catch (err) {
                console.error("Failed to fetch product IDs:", err);
            }
        }
        fetchSetProductIds();
    }, [selectedSet, decodedCardName]);

    useEffect(() => {
        if (!selectedRarity || Object.keys(rarityToProductIdMap).length === 0 || !resolvedKonamiId) return;
        const correctProductId = rarityToProductIdMap[selectedRarity.toLowerCase()];
        if (correctProductId && correctProductId !== tcgProductId) {
            router.replace(`/market-listings/${encodeURIComponent(selectedSet)}/${encodeURIComponent(decodedCardName)}?konamiId=${resolvedKonamiId}&id=${correctProductId}&rarity=${encodeURIComponent(selectedRarity)}`, { scroll: false });
        }
    }, [rarityToProductIdMap, selectedRarity, tcgProductId, selectedSet, decodedCardName, resolvedKonamiId, router]);

    const handleSetChange = (e) => {
        const newSet = e.target.value;
        setSelectedSet(newSet);
        const firstPrintingInSet = printingsMap[newSet]?.[0];
        if (firstPrintingInSet) {
            router.push(`/market-listings/${encodeURIComponent(newSet)}/${encodeURIComponent(decodedCardName)}?konamiId=${resolvedKonamiId}&id=${tcgProductId || ''}&rarity=${encodeURIComponent(firstPrintingInSet.set_rarity)}`, { scroll: false });
        }
    };

    const handleRarityClick = (printing) => {
        const targetProdId = rarityToProductIdMap[printing.set_rarity.toLowerCase()] || tcgProductId;
        router.push(`/market-listings/${encodeURIComponent(selectedSet)}/${encodeURIComponent(decodedCardName)}?konamiId=${resolvedKonamiId}&id=${targetProdId}&rarity=${encodeURIComponent(printing.set_rarity)}`, { scroll: false });
    };

    return {
        decodedCardName, tcgProductId, selectedRarity, cardDetails, comprehensiveAnalytics,
        printingsMap, selectedSet, loading, resolvedKonamiId, handleSetChange, handleRarityClick
    };
}