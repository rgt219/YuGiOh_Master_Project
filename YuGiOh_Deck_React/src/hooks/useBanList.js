import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

// 🚀 1. THE GENESYS DICTIONARY (Caches the points)
let globalGenesysMap = null;
const getGenesysMap = async () => {
  if (globalGenesysMap) return globalGenesysMap;
  try {
    const res = await fetch('https://db.ygoprodeck.com/api/v7/cardinfo.php?format=genesys&misc=yes');
    const data = await res.json();
    const map = {};
    if (data?.data) {
      data.data.forEach(card => {
        map[card.id] = card.misc_info?.[0]?.genesys_points ?? 0;
      });
    }
    globalGenesysMap = map;
    return map;
  } catch (err) {
    console.error("Failed to fetch Genesys dictionary:", err);
    return {};
  }
};

// 🚀 2. THE MASTER DUEL DICTIONARY (Forces your Scraper as the Source of Truth)
let globalMDBanlistMap = null;
const getMDBanlistMap = async () => {
  if (globalMDBanlistMap) return globalMDBanlistMap;
  try {
    // Hits your newly refactored C# controller route
    const res = await fetch(`${API_BASE_URL}/BanList/masterduel`);
    if (!res.ok) throw new Error("Failed to fetch custom MD banlist");
    
    const apiResponse = await res.json();
    const map = {};
    
    if (apiResponse && apiResponse.cards) {
      apiResponse.cards.forEach(item => {
        map[item.name] = item.status;
      });
    }
    globalMDBanlistMap = map;
    return map;
  } catch (err) {
    console.error("Failed to fetch custom MD banlist dictionary:", err);
    return {}; 
  }
};

export function useBanList(format) {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    // 🚀 3. Fetch BOTH dictionaries before processing any cards
    Promise.all([getGenesysMap(), getMDBanlistMap()]).then(([genesysMap, mdBanlistMap]) => {
      
      if (format === 'masterduel') {
          // Since we already fetched the MD map, we can just use it directly!
          const mdCardNames = Object.keys(mdBanlistMap);
          
          if (mdCardNames.length === 0) {
              setError("No cards returned from Master Duel scraper.");
              setIsLoading(false);
              return;
          }

          const chunks = [];
          for (let i = 0; i < mdCardNames.length; i += 25) {
            chunks.push(mdCardNames.slice(i, i + 25));
          }

          const fetchPromises = chunks.map(chunk => 
            fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(chunk.join('|'))}&misc=yes`)
          );

          Promise.all(fetchPromises).then(async (responses) => {
            const jsonResults = await Promise.all(responses.map(r => r.ok ? r.json() : { data: [] }));
            const rawCards = [];
            jsonResults.forEach(res => { if (res.data) rawCards.push(...res.data); });

            const formattedCards = rawCards.map((card) => {
              const priceObj = card.card_prices?.[0] || {};
              const banObj = card.banlist_info || {};
              
              const mdStatus = mdBanlistMap[card.name] || "Unlimited";
              const isLinkOrPendulum = (card.type || "").toLowerCase().includes("link") || (card.type || "").toLowerCase().includes("pendulum");

              return {
                id: card.id,
                name: card.name,
                type: card.type,
                race: card.race || "",
                attribute: card.attribute || "",
                status: mdStatus,
                desc: card.desc || "No card text available.",
                atk: card.atk ?? null,
                def: card.def ?? null,
                level: card.level ?? card.rank ?? card.linkval ?? null,
                image: card.card_images?.[0]?.image_url || "",
                fallbackImage: card.card_images?.[0]?.image_url || "",
                prices: {
                  tcgplayer: priceObj.tcgplayer_price ? `$${priceObj.tcgplayer_price}` : "N/A",
                  cardmarket: priceObj.cardmarket_price ? `€${priceObj.cardmarket_price}` : "N/A",
                  ebay: priceObj.ebay_price ? `$${priceObj.ebay_price}` : "N/A"
                },
                // Uses your custom map as the MD source of truth
                banlist: { masterduel: mdStatus, tcg: banObj.ban_tcg || "Unlimited", ocg: banObj.ban_ocg || "Unlimited" },
                isLinkOrPendulum,
                genesysPoints: isLinkOrPendulum ? "N/A" : (genesysMap[card.id] ?? 0)
              };
            });

            setCards(formattedCards);
            setIsLoading(false);
          }).catch((err) => {
            console.error("Master Duel Live API Fetch Error:", err);
            setError("Could not load live Master Duel ban list from server.");
            setIsLoading(false);
          });

      } else {
        // TCG & OCG TAB LOGIC
        fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=${format}&misc=yes`)
          .then((res) => {
            if (!res.ok) throw new Error("Failed to fetch ban list data");
            return res.json();
          })
          .then((data) => {
            const formattedCards = (data.data || []).map((card) => {
              const priceObj = card.card_prices?.[0] || {};
              const banObj = card.banlist_info || {};
              const rawStatus = format === 'ocg' ? banObj.ban_ocg : banObj.ban_tcg;

              let status = "Semi-Limited";
              if (rawStatus === "Banned" || rawStatus === "Forbidden") status = "Forbidden";
              if (rawStatus === "Limited") status = "Limited";

              const isLinkOrPendulum = (card.type || "").toLowerCase().includes("link") || (card.type || "").toLowerCase().includes("pendulum");

              // 🚀 4. THE OVERRIDE: Ignore YGOPRODeck's MD status and inject your Scraper's data instead!
              const trueMDStatus = mdBanlistMap[card.name] || "Unlimited";

              return {
                id: card.id, name: card.name, type: card.type, race: card.race || "", attribute: card.attribute || "",
                status: status, desc: card.desc || "No card text available.", atk: card.atk ?? null, def: card.def ?? null,
                level: card.level ?? card.rank ?? card.linkval ?? null, image: card.card_images?.[0]?.image_url || "",
                fallbackImage: card.card_images?.[0]?.image_url || "",
                prices: { tcgplayer: priceObj.tcgplayer_price ? `$${priceObj.tcgplayer_price}` : "N/A", cardmarket: priceObj.cardmarket_price ? `€${priceObj.cardmarket_price}` : "N/A", ebay: priceObj.ebay_price ? `$${priceObj.ebay_price}` : "N/A" },
                banlist: { 
                  masterduel: trueMDStatus, // 🚀 Override applied here
                  tcg: banObj.ban_tcg || "Unlimited", 
                  ocg: banObj.ban_ocg || "Unlimited" 
                },
                isLinkOrPendulum, 
                genesysPoints: isLinkOrPendulum ? "N/A" : (genesysMap[card.id] ?? 0)
              };
            });
            setCards(formattedCards);
            setIsLoading(false);
          })
          .catch((err) => {
            console.error(`${format.toUpperCase()} Fetch Error:`, err);
            setError(`Could not load live ${format.toUpperCase()} ban list.`);
            setIsLoading(false);
          });
      }
    });

  }, [format]);

  return { cards, isLoading, error };
}