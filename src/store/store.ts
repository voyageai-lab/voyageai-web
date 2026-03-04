import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import projectsReducer from './projectsSlice';
import communityReducer from './communitySlice';
import presenceReducer from './presenceSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    projects: projectsReducer,
    community: communityReducer,
    presence: presenceReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
