import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import planningReducer from './planningSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    planning: planningReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
