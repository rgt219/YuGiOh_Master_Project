import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || process.env.REACT_APP_API_URL || 
  'https://api.happybush-e43d89b2.eastus.azurecontainerapps.io/api';

export function useMetaDeckProfile() {
  const params = useParams();
  const id = params?.id;

  const [deck, setDeck] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const [cardMap, setCardMap] = useState({});
  const [cardCounts, setCardCounts] = useState({ monsters: 0, spells: 0, traps: 0 });
  const [hoveredCardData, setHoveredCardData] = useState(null);
  const [pinnedCardData, setPinnedCardData] = useState(null); 

  useEffect(() => {
    if (!id || id === 'undefined') {
      setError('Invalid Deck ID provided.');
      setLoading(false);
      return;
    }

    fetch(`${API_BASE_URL}/metadecks/${id}`)
      .then(async (res) => {
        if (!res.ok) {
          const errData = await res.json().catch(() => null);
          throw new Error(errData?.message || `Server responded with HTTP ${res.status}`);
        }
        return res.json();
      })
      .then(async (deckData) => {
        setDeck(deckData);

        const sampleDeck = deckData?.sampleDeck || deckData?.SampleDeck;
        const mainDeckIds = sampleDeck?.mainDeck || sampleDeck?.MainDeck || [];
        const extraDeckIds = sampleDeck?.extraDeck || sampleDeck?.ExtraDeck || [];
        const sideDeckIds = sampleDeck?.sideDeck || sampleDeck?.SideDeck || [];

        const allDeckIds = [...mainDeckIds, ...extraDeckIds, ...sideDeckIds];
        const uniqueIds = [...new Set(allDeckIds)];

        if (uniqueIds.length > 0) {
          try {
            const ygoRes = await fetch(
              `https://db.ygoprodeck.com/api/v7/cardinfo.php?id=${uniqueIds.join(',')}`
            );
            
            if (ygoRes.ok) {
              const ygoData = await ygoRes.json();
              if (ygoData?.data) {
                const map = {};
                ygoData.data.forEach((c) => {
                  map[c.id.toString()] = c;
                });
                setCardMap(map);

                let monsters = 0;
                let spells = 0;
                let traps = 0;

                mainDeckIds.forEach((cardId) => {
                  const info = map[cardId.toString()];
                  if (info) {
                    const type = info.type.toLowerCase();
                    if (type.includes('spell')) spells++;
                    else if (type.includes('trap')) traps++;
                    else monsters++;
                  } else {
                    monsters++;
                  }
                });

                setCardCounts({ monsters, spells, traps });

                if (mainDeckIds[0] && map[mainDeckIds[0].toString()]) {
                  setHoveredCardData(map[mainDeckIds[0].toString()]);
                }
              }
            }
          } catch (err) {
            console.warn('Could not fetch detailed card info from YGOProDeck:', err);
          }
        }

        setLoading(false);
      })
      .catch((err) => {
        console.error('Error fetching meta deck profile:', err);
        setError(err.message);
        setLoading(false);
      });
  }, [id]);

  const handleCardHover = (cardData) => {
    if (!pinnedCardData && cardData) {
      setHoveredCardData(cardData);
    }
  };

  const handleCardClick = (cardData) => {
    if (!cardData) return;
    if (pinnedCardData?.id === cardData.id) {
      setPinnedCardData(null);
    } else {
      setPinnedCardData(cardData);
    }
  };

  return {
    id, deck, loading, error, cardMap, cardCounts,
    hoveredCardData, pinnedCardData, setPinnedCardData,
    handleCardHover, handleCardClick
  };
}