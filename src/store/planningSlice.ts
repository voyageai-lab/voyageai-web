import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/api/client';
import type {
  Itinerary,
  PlanningRequest,
  PlanningSubmitResponse,
  TaskStatus,
  ToolTrace,
} from '@/types';

interface PlanningState {
  taskId: string | null;
  status: TaskStatus | null;
  progress: number;
  progressMessage: string;
  itinerary: Itinerary | null;
  toolTrace: ToolTrace[];
  error: string | null;
  loading: boolean;
  sseConnected: boolean;
}

const initialState: PlanningState = {
  taskId: null,
  status: null,
  progress: 0,
  progressMessage: '',
  itinerary: null,
  toolTrace: [],
  error: null,
  loading: false,
  sseConnected: false,
};

export const submitPlanning = createAsyncThunk<
  PlanningSubmitResponse,
  PlanningRequest
>('planning/submit', async (request) => {
  return apiClient.post<PlanningSubmitResponse>('/planning/generate', request);
});

const planningSlice = createSlice({
  name: 'planning',
  initialState,
  reducers: {
    setProgress(
      state,
      action: PayloadAction<{
        status: TaskStatus;
        progress: number;
        message: string;
      }>,
    ) {
      state.status = action.payload.status;
      state.progress = action.payload.progress;
      state.progressMessage = action.payload.message;
    },
    setCompleted(
      state,
      action: PayloadAction<{
        itinerary: Itinerary;
        toolTrace?: ToolTrace[];
      }>,
    ) {
      state.status = 'COMPLETED';
      state.progress = 100;
      state.progressMessage = 'Itinerary generated successfully!';
      state.itinerary = action.payload.itinerary;
      state.toolTrace = action.payload.toolTrace || [];
      state.loading = false;
    },
    setFailed(state, action: PayloadAction<string>) {
      state.status = 'FAILED';
      state.progress = 0;
      state.error = action.payload;
      state.loading = false;
    },
    setSseConnected(state, action: PayloadAction<boolean>) {
      state.sseConnected = action.payload;
    },
    resetPlanning(state) {
      Object.assign(state, initialState);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(submitPlanning.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.itinerary = null;
        state.toolTrace = [];
        state.progress = 0;
        state.status = 'PENDING';
      })
      .addCase(submitPlanning.fulfilled, (state, action) => {
        state.taskId = action.payload.taskId;
        state.status = 'PROCESSING';
        // loading stays true until SSE completes/fails
      })
      .addCase(submitPlanning.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit planning request';
        state.status = 'FAILED';
      });
  },
});

export const {
  setProgress,
  setCompleted,
  setFailed,
  setSseConnected,
  resetPlanning,
} = planningSlice.actions;
export default planningSlice.reducer;
