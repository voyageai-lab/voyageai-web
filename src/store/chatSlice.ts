import { createSlice, createAsyncThunk, type PayloadAction } from '@reduxjs/toolkit';
import { apiClient } from '@/api/client';
import type {
  AgentEvent,
  ChatMessage,
  PlanningRequest,
  PlanningSubmitResponse,
  StructuredItinerary,
  TaskStatus,
  ToolTrace,
  ConversationHistoryResponse,
} from '@/types';
import { normalizeItinerary } from '@/utils/normalizeItinerary';

interface ChatState {
  messages: ChatMessage[];
  currentTaskId: string | null;
  currentProjectId: string | null;
  status: TaskStatus | null;
  progress: number;
  progressMessage: string;
  itinerary: StructuredItinerary | null;
  toolTrace: ToolTrace[];
  error: string | null;
  loading: boolean;
  sseConnected: boolean;
}

const initialState: ChatState = {
  messages: [],
  currentTaskId: null,
  currentProjectId: null,
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
>('chat/submit', async (request) => {
  return apiClient.post<PlanningSubmitResponse>('/planning/generate', request);
});

export const loadConversationHistory = createAsyncThunk<
  ConversationHistoryResponse,
  string
>('chat/loadHistory', async (projectId) => {
  return apiClient.get<ConversationHistoryResponse>(
    `/planning/projects/${projectId}/history`,
  );
});

const chatSlice = createSlice({
  name: 'chat',
  initialState,
  reducers: {
    addUserMessage(state, action: PayloadAction<string>) {
      const msg: ChatMessage = {
        id: `msg-${Date.now()}`,
        role: 'user',
        content: action.payload,
        timestamp: new Date().toISOString(),
      };
      state.messages.push(msg);
    },
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

      // Update or add the assistant "typing" message
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status && lastMsg.status !== 'COMPLETED') {
        lastMsg.progress = action.payload.progress;
        lastMsg.progressMessage = action.payload.message;
        lastMsg.status = action.payload.status;
        lastMsg.content = action.payload.message;
      }
    },
    setCompleted(
      state,
      action: PayloadAction<{
        itinerary: StructuredItinerary | null;
        toolTrace?: ToolTrace[];
        rawResult?: string;
      }>,
    ) {
      state.status = 'COMPLETED';
      state.progress = 100;
      state.progressMessage = 'Itinerary generated successfully!';
      state.itinerary = action.payload.itinerary;
      state.toolTrace = action.payload.toolTrace || [];
      state.loading = false;

      // Update the assistant message to final state
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.status = 'COMPLETED';
        lastMsg.progress = 100;
        lastMsg.progressMessage = 'Done';
        lastMsg.itinerary = action.payload.itinerary ?? undefined;
        lastMsg.toolTrace = action.payload.toolTrace;
        lastMsg.content = action.payload.itinerary
          ? `Here's your travel itinerary for ${action.payload.itinerary.metadata?.destination ?? 'your trip'}!`
          : 'Your itinerary has been generated.';
      }
    },
    setFailed(state, action: PayloadAction<string>) {
      state.status = 'FAILED';
      state.progress = 0;
      state.error = action.payload;
      state.loading = false;

      // Update assistant message
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant') {
        lastMsg.status = 'FAILED';
        lastMsg.content = `Sorry, something went wrong: ${action.payload}`;
      }
    },
    addAgentEvent(state, action: PayloadAction<AgentEvent>) {
      // Append the event to the current assistant message's agentEvents array
      const lastMsg = state.messages[state.messages.length - 1];
      if (lastMsg && lastMsg.role === 'assistant' && lastMsg.status !== 'COMPLETED') {
        if (!lastMsg.agentEvents) {
          lastMsg.agentEvents = [];
        }
        lastMsg.agentEvents.push(action.payload);
      }
    },
    setSseConnected(state, action: PayloadAction<boolean>) {
      state.sseConnected = action.payload;
    },
    resetChat(state) {
      Object.assign(state, initialState);
    },
    setCurrentProjectId(state, action: PayloadAction<string | null>) {
      state.currentProjectId = action.payload;
    },
    clearChatForProject(state) {
      // Keep initial state but clear messages/itinerary for switching projects
      state.messages = [];
      state.currentTaskId = null;
      state.currentProjectId = null;
      state.status = null;
      state.progress = 0;
      state.progressMessage = '';
      state.itinerary = null;
      state.toolTrace = [];
      state.error = null;
      state.loading = false;
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
        state.currentTaskId = action.payload.taskId;
        state.currentProjectId = action.payload.projectId;
        state.status = 'PROCESSING';
        // Add an assistant "typing" message
        state.messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: 'Planning your trip...',
          timestamp: new Date().toISOString(),
          taskId: action.payload.taskId,
          status: 'PROCESSING',
          progress: 0,
          progressMessage: 'Starting...',
        });
      })
      .addCase(submitPlanning.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to submit planning request';
        state.status = 'FAILED';
        state.messages.push({
          id: `msg-${Date.now()}`,
          role: 'assistant',
          content: `Failed to start planning: ${action.error.message || 'Unknown error'}`,
          timestamp: new Date().toISOString(),
          status: 'FAILED',
        });
      })
      .addCase(loadConversationHistory.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadConversationHistory.fulfilled, (state, action) => {
        state.loading = false;
        // Clear any in-flight task state
        state.currentTaskId = null;
        state.status = null;
        state.progress = 0;
        state.progressMessage = '';
        state.toolTrace = [];
        state.error = null;

        // Convert backend ConversationMessages to ChatMessages
        const chatMessages: ChatMessage[] = action.payload.messages.map((msg) => ({
          id: msg.messageId,
          role: msg.role === 'USER' ? 'user' : msg.role === 'ASSISTANT' ? 'assistant' : 'system',
          content: msg.content,
          timestamp: msg.timestamp,
          itinerary: msg.structuredData ? tryParseItinerary(msg.structuredData) : undefined,
          status: msg.structuredData ? 'COMPLETED' as TaskStatus : undefined,
        }));
        state.messages = chatMessages;

        // Extract the latest itinerary from loaded messages for the panel
        const lastItineraryMsg = [...chatMessages].reverse().find((m) => m.itinerary);
        state.itinerary = lastItineraryMsg?.itinerary ?? null;
      })
      .addCase(loadConversationHistory.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load conversation history';
      });
  },
});

function tryParseItinerary(json: string): StructuredItinerary | undefined {
  try {
    const raw = JSON.parse(json);
    // Normalize snake_case (Python) → camelCase (TypeScript) field names
    return normalizeItinerary(raw);
  } catch {
    return undefined;
  }
}

export const {
  addUserMessage,
  setProgress,
  setCompleted,
  setFailed,
  addAgentEvent,
  setSseConnected,
  resetChat,
  setCurrentProjectId,
  clearChatForProject,
} = chatSlice.actions;
export default chatSlice.reducer;
