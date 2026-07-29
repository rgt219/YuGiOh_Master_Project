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
      const card = action.payload;
      
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
        const targetId = action.payload; // Primitive string passed from handleRemoveCard

        if (state.mainDeck) {
            // Find index of exact match (by instanceId or card id)
            const mainIndex = state.mainDeck.findIndex(
                (c) => c.instanceId === targetId || (c.id || c.Id)?.toString() === targetId?.toString()
            );
            if (mainIndex !== -1) {
                state.mainDeck.splice(mainIndex, 1); // Remove only 1 copy
                return;
            }
        }

        if (state.extraDeck) {
            const extraIndex = state.extraDeck.findIndex(
                (c) => c.instanceId === targetId || (c.id || c.Id)?.toString() === targetId?.toString()
            );
            if (extraIndex !== -1) {
                state.extraDeck.splice(extraIndex, 1);
            }
        }
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
    },

    // 🚀 ACTION: Clear Deck (Resets all cards and deck name)
    clearDeck: (state) => {
      state.mainDeck = [];
      state.extraDeck = [];
      state.deckName = '';
    }
  },
});

export const { 
  addCardToDeck, 
  removeCardFromDeck, 
  updateDeckName, 
  importYdkDeck, 
  clearDeck 
} = deckSlice.actions;

export default deckSlice.reducer;