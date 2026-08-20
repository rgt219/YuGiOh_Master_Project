// utils/deckHelpers.js
const AZURE_BLOB_BASE_URL = "https://ygocardstore-images-gpctdecsa6a6ctfc.z01.azurefd.net/card-images";

export const getFannedCards = (main = [], extra = [], side = []) => {
  const combined = [...main, ...extra, ...side].filter(Boolean);
  
  const extractedIds = combined.map(c => {
      if (typeof c === 'object' && c !== null) {
          return c.id || c.Id || c.cardId || c._id;
      }
      return c;
  }).filter(Boolean);

  const unique = Array.from(new Set(extractedIds));
  
  while (unique.length < 3) {
    unique.push('back_high');
  }
  return unique.slice(0, 3);
};

export const getCardImageUrl = (cardId) => {
    if (!cardId || cardId === 'back_high') {
        return 'https://images.ygoprodeck.com/images/cards/back_high.jpg';
    }
    return `${AZURE_BLOB_BASE_URL}/${cardId}.jpg`;
};