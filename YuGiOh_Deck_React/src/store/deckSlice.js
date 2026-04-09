import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mainDeck: [],
  extraDeck: [],
  deckName: '',
};

export const deckSlice = createSlice({
  name: 'deck',
  initialState,
  reducers: {
    // ACTION: Add a card
    addCardToDeck: (state, action) => {
      const card = action.payload; // payload is the card object from your API
      
      // Determine if it's an Extra Deck monster
      const isExtra = card.type?.includes("Fusion") || card.type?.includes("Synchro") || 
                      card.type?.includes("Link") || card.type?.includes("XYZ");

      if (isExtra) {
        if (state.extraDeck.length < 15) {
          state.extraDeck.push({ ...card, instanceId: Math.random() });
        }
      } else {
        if (state.mainDeck.length < 60) {
          state.mainDeck.push({ ...card, instanceId: Math.random() });
        }
      }
    },

    // ACTION: Remove a card
    removeCardFromDeck: (state, action) => {
      // payload here will just be the instanceId
      state.mainDeck = state.mainDeck.filter(c => c.instanceId !== action.payload);
      state.extraDeck = state.extraDeck.filter(c => c.instanceId !== action.payload);
    },

    // ACTION: Set Name
    updateDeckName: (state, action) => {
      state.deckName = action.payload;
    },

    // ACTION: Import YDK (Replaces entire deck)
    importYdkDeck: (state, action) => {
      state.mainDeck = action.payload.main;
      state.extraDeck = action.payload.extra;
      state.deckName = action.payload.name;
    }
  },
});

// We export the "Action Creators" so components can trigger these functions
export const { addCardToDeck, removeCardFromDeck, updateDeckName, importYdkDeck } = deckSlice.actions;

// We export the reducer to be plugged into store.js
export default deckSlice.reducer;