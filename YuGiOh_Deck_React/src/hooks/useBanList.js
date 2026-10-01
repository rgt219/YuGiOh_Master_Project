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

// 🚀 2. THE BAN LISTS (Your API is the source of truth for Master Duel, TCG and OCG)
// Each entry is { id, name, status }. `id` is the YGOPRODeck card id, matched on the server,
// so card names that are spelled differently between sites ("Maliss <Q> Red Ransom" vs
// "Maliss Q Red Ransom") no longer get lost.
let globalBanLists = null;
const getBanLists = async () => {
  if (globalBanLists) return globalBanLists;
  try {
    const res = await fetch(`${API_BASE_URL}/BanList/cards`);
    if (!res.ok) throw new Error("Failed to fetch ban lists");
    const data = await res.json();
    const build = (entries = []) => {
      const byId = {};
      entries.forEach(e => { if (e.id) byId[e.id] = e.status; });
      return { entries, byId };
    };
    globalBanLists = {
      masterduel: build(data.masterduel),
      tcg: build(data.tcg),
      ocg: build(data.ocg),
    };
    return globalBanLists;
  } catch (err) {
    console.error("Failed to fetch ban lists from API:", err);
    // Not cached, so the next visit tries again.
    return { masterduel: build0(), tcg: build0(), ocg: build0() };
  }
};
const build0 = () => ({ entries: [], byId: {} });

// YGOPRODeck lookup by card id, 50 at a time.
const fetchCardsByIds = async (ids) => {
  const chunks = [];
  for (let i = 0; i < ids.length; i += 50) chunks.push(ids.slice(i, i + 50));
  const responses = await Promise.all(
    chunks.map(chunk => fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${chunk.join(',')}&misc=yes`))
  );
  const json = await Promise.all(responses.map(r => (r.ok ? r.json() : { data: [] })));
  return json.flatMap(j => j.data || []);
};

const toStatus = (raw) => {
  if (raw === "Banned" || raw === "Forbidden") return "Forbidden";
  if (raw === "Limited") return "Limited";
  return "Semi-Limited";
};

export function useBanList(format) {
  const [cards, setCards] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let cancelled = false;
    setIsLoading(true);
    setError(null);

    const formatCard = (card, genesysMap, lists, status) => {
      const priceObj = card.card_prices?.[0] || {};
      const banObj = card.banlist_info || {};
      const isLinkOrPendulum = (card.type || "").toLowerCase().includes("link") || (card.type || "").toLowerCase().includes("pendulum");
      const image = card.card_images?.[0]?.image_url || "";

      return {
        id: card.id, name: card.name, type: card.type, race: card.race || "", attribute: card.attribute || "",
        status, desc: card.desc || "No card text available.", atk: card.atk ?? null, def: card.def ?? null,
        level: card.level ?? card.rank ?? card.linkval ?? null, image, fallbackImage: image,
        prices: {
          tcgplayer: priceObj.tcgplayer_price ? `$${priceObj.tcgplayer_price}` : "N/A",
          cardmarket: priceObj.cardmarket_price ? `€${priceObj.cardmarket_price}` : "N/A",
          ebay: priceObj.ebay_price ? `$${priceObj.ebay_price}` : "N/A"
        },
        banlist: {
          masterduel: lists.masterduel.byId[card.id] || "Unlimited",
          tcg: lists.tcg.byId[card.id] || banObj.ban_tcg || "Unlimited",
          ocg: lists.ocg.byId[card.id] || banObj.ban_ocg || "Unlimited"
        },
        isLinkOrPendulum,
        genesysPoints: isLinkOrPendulum ? "N/A" : (genesysMap[card.id] ?? 0)
      };
    };

    const load = async () => {
      const [genesysMap, lists] = await Promise.all([getGenesysMap(), getBanLists()]);
      const own = lists[format] || build0();

      if (format === 'masterduel') {
        const ids = own.entries.filter(e => e.id).map(e => e.id);
        if (ids.length === 0) throw new Error("No cards returned from the Master Duel ban list.");
        const raw = await fetchCardsByIds(ids);
        return raw.map(card => formatCard(card, genesysMap, lists, own.byId[card.id] || "Unlimited"));
      }

      // TCG & OCG: YGOPRODeck's list, plus anything your API knows about that YGOPRODeck doesn't have yet.
      let ygoCards = [];
      try {
        const res = await fetch(`https://db.ygoprodeck.com/api/v7/cardinfo.php?banlist=${format}&misc=yes`);
        if (res.ok) ygoCards = (await res.json()).data || [];
      } catch (err) {
        console.error(`${format.toUpperCase()} YGOPRODeck fetch error:`, err);
      }

      const have = new Set(ygoCards.map(c => c.id));
      const missingIds = own.entries.filter(e => e.id && !have.has(e.id)).map(e => e.id);
      const extra = missingIds.length ? await fetchCardsByIds(missingIds) : [];

      const all = [...ygoCards, ...extra];
      if (all.length === 0) throw new Error(`No cards returned for the ${format.toUpperCase()} ban list.`);

      return all.map(card => {
        // Your API's status wins; otherwise fall back to what YGOPRODeck says.
        const rawYgo = format === 'ocg' ? card.banlist_info?.ban_ocg : card.banlist_info?.ban_tcg;
        return formatCard(card, genesysMap, lists, own.byId[card.id] || toStatus(rawYgo));
      });
    };

    load()
      .then((formatted) => { if (!cancelled) { setCards(formatted); setIsLoading(false); } })
      .catch((err) => {
        console.error(`${format.toUpperCase()} ban list error:`, err);
        if (!cancelled) {
          setError(`Could not load the ${format.toUpperCase()} ban list.`);
          setIsLoading(false);
        }
      });

    return () => { cancelled = true; };
  }, [format]);

  return { cards, isLoading, error };
}