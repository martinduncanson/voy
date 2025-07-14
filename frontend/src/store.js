import { configureStore } from '@reduxjs/toolkit';
import reservationsReducer from './slices/reservationsSlice'; // Create slice separately

export const store = configureStore({
  reducer: {
    reservations: reservationsReducer,
  },
});