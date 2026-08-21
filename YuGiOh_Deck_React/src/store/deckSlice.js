import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  mainDeck: [],
  extraDeck: [],
  sideDeck: [], // 1. Added sideDeck to initial state
  deckName: '',
};

export const deckSlice = createSlice({
  name: 'deck',
  initialState,
  reducers: {
    // ACTION: Add a card
    addCardToDeck: (state, action) => {
      // 2. Safely extract the payload whether it's the new format {card, isSideDeck} or legacy fallback
      const card = action.payload.card || action.payload; 
      const isSideDeck = action.payload.isSideDeck || false;
      
      const isExtra = card.type?.includes("Fusion") || card.type?.includes("Synchro") || 
                      card.type?.includes("Link") || card.type?.includes("XYZ");

      // 3. Side Deck logic (Max 15 cards)
      if (isSideDeck) {
        if (state.sideDeck.length < 15) {
          state.sideDeck.push({ ...card, instanceId: Math.random() });
        }
      } else if (isExtra) {
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
        const targetId = action.payload; 

        if (state.mainDeck) {
            const mainIndex = state.mainDeck.findIndex(
                (c) => c.instanceId === targetId || (c.id || c.Id)?.toString() === targetId?.toString()
            );
            if (mainIndex !== -1) {
                state.mainDeck.splice(mainIndex, 1); 
                return;
            }
        }

        if (state.extraDeck) {
            const extraIndex = state.extraDeck.findIndex(
                (c) => c.instanceId === targetId || (c.id || c.Id)?.toString() === targetId?.toString()
            );
            if (extraIndex !== -1) {
                state.extraDeck.splice(extraIndex, 1);
                return; // Added return to stop searching if found
            }
        }

        // 4. Added side deck removal logic
        if (state.sideDeck) {
            const sideIndex = state.sideDeck.findIndex(
                (c) => c.instanceId === targetId || (c.id || c.Id)?.toString() === targetId?.toString()
            );
            if (sideIndex !== -1) {
                state.sideDeck.splice(sideIndex, 1);
            }
        }
    },

    // ACTION: Set Name
    updateDeckName: (state, action) => {
      state.deckName = action.payload;
    },

    // ACTION: Import YDK 
    importYdkDeck: (state, action) => {
      state.mainDeck = action.payload.main || [];
      state.extraDeck = action.payload.extra || [];
      state.sideDeck = action.payload.side || []; // 5. Added side deck import support
      state.deckName = action.payload.name;
    },

    // ACTION: Clear Deck 
    clearDeck: (state) => {
      state.mainDeck = [];
      state.extraDeck = [];
      state.sideDeck = []; // 6. Clears side deck
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