import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/api/client';
import type { PresenceUser } from '@/types';

interface PresenceState {
  /** Map of projectId -> list of online users. */
  onlineUsers: Record<string, PresenceUser[]>;
}

const initialState: PresenceState = {
  onlineUsers: {},
};

export const fetchPresence = createAsyncThunk<
  { projectId: string; users: PresenceUser[] },
  string
>('presence/fetch', async (projectId) => {
  const users = await apiClient.get<PresenceUser[]>(
    `/projects/${projectId}/presence`,
  );
  return { projectId, users };
});

export const sendHeartbeat = createAsyncThunk<void, string>(
  'presence/heartbeat',
  async (projectId) => {
    await apiClient.post(`/projects/${projectId}/presence`);
  },
);

const presenceSlice = createSlice({
  name: 'presence',
  initialState,
  reducers: {
    updatePresence(
      state,
      action: PayloadAction<{ projectId: string; users: PresenceUser[] }>,
    ) {
      state.onlineUsers[action.payload.projectId] = action.payload.users;
    },
    clearPresence(state, action: PayloadAction<string>) {
      delete state.onlineUsers[action.payload];
    },
  },
  extraReducers: (builder) => {
    builder.addCase(fetchPresence.fulfilled, (state, action) => {
      state.onlineUsers[action.payload.projectId] = action.payload.users;
    });
  },
});

export const { updatePresence, clearPresence } = presenceSlice.actions;
export default presenceSlice.reducer;
