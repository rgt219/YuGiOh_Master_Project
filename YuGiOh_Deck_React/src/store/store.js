import { configureStore } from '@reduxjs/toolkit';
import deckReducer from './deckSlice';

// configureStore is an "Enterprise" wrapper that automatically 
// sets up the Redux DevTools and middleware.
export const store = configureStore({
  reducer: {
    // This key "deck" is how you will access this data 
    // using useSelector(state => state.deck)
    deck: deckReducer, 
  },
});