import { useState, useEffect } from 'react';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

export function useBanList(format) {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    setIsLoading(true);
    setError(null);

    if (format === 'masterduel') {
      fetch(`${API_BASE_URL}/BanList/masterduel`)
        .then((res) => {
          if (!res.ok) throw new Error("C# API returned HTTP " + res.status);
          return res.json();
        })
        .then((apiResponse) => {
          const scrapedCards = apiResponse.cards || [];
          if (scrapedCards.length === 0) throw new Error("No cards returned from Master Duel scraper.");

          const dynamicStatusMap = {};
          scrapedCards.forEach(item => { dynamicStatusMap[item.name] = item.status; });

          const mdCardNames = Object.keys(dynamicStatusMap);
          const chunks = [];
          for (let i = 0; i < mdCardNames.length; i += 25) {
            chunks.push(mdCardNames.slice(i, i + 25));
          }

          const fetchPromises = chunks.map(chunk => 
            fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?name=${encodeURIComponent(chunk.join('|'))}&misc=yes`)
          );

          return Promise.all(fetchPromises).then(async (responses) => {
            const jsonResults = await Promise.all(responses.map(r => r.ok ? r.json() : { data: [] }));
            const rawCards = [];
            jsonResults.forEach(res => { if (res.data) rawCards.push(...res.data); });

            const formattedCards = rawCards.map((card) => {
              const priceObj = card.card_prices?.[0] || {};
              const banObj = card.banlist_info || {};
              const miscObj = card.misc_info?.[0] || {};
              const mdStatus = dynamicStatusMap[card.name] || "Unlimited";
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
                banlist: { masterduel: mdStatus, tcg: banObj.ban_tcg || "Unlimited", ocg: banObj.ban_ocg || "Unlimited" },
                isLinkOrPendulum,
                genesysPoints: isLinkOrPendulum ? "N/A" : (miscObj.genesys_points ?? 0)
              };
            });

            setCards(formattedCards);
            setIsLoading(false);
          });
        })
        .catch((err) => {
          console.error("Master Duel Live API Fetch Error:", err);
          setError("Could not load live Master Duel ban list from server.");
          setIsLoading(false);
        });
    } else {
      fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=${format}&misc=yes`)
        .then((res) => {
          if (!res.ok) throw new Error("Failed to fetch ban list data");
          return res.json();
        })
        .then((data) => {
          const formattedCards = (data.data || []).map((card) => {
            const priceObj = card.card_prices?.[0] || {};
            const banObj = card.banlist_info || {};
            const miscObj = card.misc_info?.[0] || {};
            const rawStatus = format === 'ocg' ? banObj.ban_ocg : banObj.ban_tcg;

            let status = "Semi-Limited";
            if (rawStatus === "Banned" || rawStatus === "Forbidden") status = "Forbidden";
            if (rawStatus === "Limited") status = "Limited";

            const isLinkOrPendulum = (card.type || "").toLowerCase().includes("link") || (card.type || "").toLowerCase().includes("pendulum");

            return {
              id: card.id, name: card.name, type: card.type, race: card.race || "", attribute: card.attribute || "",
              status: status, desc: card.desc || "No card text available.", atk: card.atk ?? null, def: card.def ?? null,
              level: card.level ?? card.rank ?? card.linkval ?? null, image: card.card_images?.[0]?.image_url || "",
              fallbackImage: card.card_images?.[0]?.image_url || "",
              prices: { tcgplayer: priceObj.tcgplayer_price ? `$${priceObj.tcgplayer_price}` : "N/A", cardmarket: priceObj.cardmarket_price ? `€${priceObj.cardmarket_price}` : "N/A", ebay: priceObj.ebay_price ? `$${priceObj.ebay_price}` : "N/A" },
              banlist: { masterduel: banObj.ban_masterduel || "Unlimited", tcg: banObj.ban_tcg || "Unlimited", ocg: banObj.ban_ocg || "Unlimited" },
              isLinkOrPendulum, genesysPoints: isLinkOrPendulum ? "N/A" : (miscObj.genesys_points ?? 0)
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
  }, [format]);

  return { cards, isLoading, error };
}