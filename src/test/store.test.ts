import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout, setUser, setToken, clearError } from '@/store/authSlice';
import chatReducer, {
  addUserMessage,
  setProgress,
  setCompleted,
  setFailed,
  resetChat,
  setSseConnected,
  clearChatForProject,
} from '@/store/chatSlice';
import projectsReducer, {
  setActiveProject,
  addProject,
  clearProjects,
} from '@/store/projectsSlice';
import type { StructuredItinerary } from '@/types';

// ==============================
// Auth Slice Tests
// ==============================

describe('authSlice', () => {
  const createStore = () =>
    configureStore({ reducer: { auth: authReducer } });

  it('should have correct initial state', () => {
    const store = createStore();
    const state = store.getState().auth;
    expect(state.user).toBeNull();
    expect(state.loading).toBe(false);
    expect(state.error).toBeNull();
  });

  it('should handle setUser', () => {
    const store = createStore();
    store.dispatch(setUser({ id: 1, email: 'test@example.com', displayName: 'test', avatarUrl: null, authProvider: 'LOCAL' }));
    expect(store.getState().auth.user?.displayName).toBe('test');
  });

  it('should handle setToken', () => {
    const store = createStore();
    store.dispatch(setToken('jwt-token-123'));
    expect(store.getState().auth.token).toBe('jwt-token-123');
  });

  it('should handle logout', () => {
    const store = createStore();
    store.dispatch(setUser({ id: 1, email: 'test@example.com', displayName: 'test', avatarUrl: null, authProvider: 'LOCAL' }));
    store.dispatch(logout());
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.token).toBeNull();
  });

  it('should handle clearError', () => {
    const store = createStore();
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });
});

// ==============================
// Chat Slice Tests
// ==============================

describe('chatSlice', () => {
  const createStore = () =>
    configureStore({ reducer: { chat: chatReducer } });

  it('should have correct initial state', () => {
    const store = createStore();
    const state = store.getState().chat;
    expect(state.messages).toEqual([]);
    expect(state.currentTaskId).toBeNull();
    expect(state.status).toBeNull();
    expect(state.progress).toBe(0);
    expect(state.itinerary).toBeNull();
    expect(state.toolTrace).toEqual([]);
    expect(state.loading).toBe(false);
  });

  it('should handle addUserMessage', () => {
    const store = createStore();
    store.dispatch(addUserMessage('Plan a trip to Tokyo'));
    const state = store.getState().chat;
    expect(state.messages).toHaveLength(1);
    expect(state.messages[0].role).toBe('user');
    expect(state.messages[0].content).toBe('Plan a trip to Tokyo');
  });

  it('should handle setProgress', () => {
    const store = createStore();
    store.dispatch(
      setProgress({
        status: 'PROCESSING',
        progress: 50,
        message: 'Calling tools...',
      }),
    );
    const state = store.getState().chat;
    expect(state.status).toBe('PROCESSING');
    expect(state.progress).toBe(50);
    expect(state.progressMessage).toBe('Calling tools...');
  });

  it('should handle setCompleted with structured itinerary', () => {
    const store = createStore();
    const mockItinerary: StructuredItinerary = {
      metadata: {
        destination: 'Tokyo',
        startDate: '2025-07-01',
        endDate: '2025-07-05',
        totalDays: 5,
        budget: '$3000',
        interests: ['food', 'culture'],
      },
      days: [],
    };

    // Add an assistant message first (simulating the flow)
    store.dispatch(addUserMessage('Plan Tokyo trip'));

    store.dispatch(setCompleted({ itinerary: mockItinerary }));
    const state = store.getState().chat;
    expect(state.status).toBe('COMPLETED');
    expect(state.progress).toBe(100);
    expect(state.itinerary?.metadata.destination).toBe('Tokyo');
    expect(state.loading).toBe(false);
  });

  it('should handle setCompleted with tool trace', () => {
    const store = createStore();
    const mockItinerary: StructuredItinerary = {
      metadata: {
        destination: 'Paris',
        startDate: '2025-08-01',
        endDate: '2025-08-03',
        totalDays: 3,
        budget: '$2000',
        interests: [],
      },
      days: [],
    };

    store.dispatch(
      setCompleted({
        itinerary: mockItinerary,
        toolTrace: [
          {
            tool: 'get_weather_forecast',
            arguments: { lat: 48.85, lon: 2.35 },
            latency_ms: 120,
            success: true,
          },
        ],
      }),
    );

    const state = store.getState().chat;
    expect(state.toolTrace).toHaveLength(1);
    expect(state.toolTrace[0].tool).toBe('get_weather_forecast');
  });

  it('should handle setFailed', () => {
    const store = createStore();
    store.dispatch(setFailed('Pipeline timed out after 120s'));
    const state = store.getState().chat;
    expect(state.status).toBe('FAILED');
    expect(state.error).toBe('Pipeline timed out after 120s');
    expect(state.loading).toBe(false);
  });

  it('should handle setSseConnected', () => {
    const store = createStore();
    store.dispatch(setSseConnected(true));
    expect(store.getState().chat.sseConnected).toBe(true);
    store.dispatch(setSseConnected(false));
    expect(store.getState().chat.sseConnected).toBe(false);
  });

  it('should handle resetChat', () => {
    const store = createStore();
    store.dispatch(addUserMessage('test'));
    store.dispatch(
      setProgress({ status: 'PROCESSING', progress: 50, message: 'test' }),
    );
    store.dispatch(resetChat());
    const state = store.getState().chat;
    expect(state.messages).toEqual([]);
    expect(state.currentTaskId).toBeNull();
    expect(state.status).toBeNull();
    expect(state.progress).toBe(0);
    expect(state.itinerary).toBeNull();
  });

  it('should handle clearChatForProject', () => {
    const store = createStore();
    store.dispatch(addUserMessage('test'));
    store.dispatch(clearChatForProject());
    const state = store.getState().chat;
    expect(state.messages).toEqual([]);
    expect(state.loading).toBe(false);
  });
});

// ==============================
// Projects Slice Tests
// ==============================

describe('projectsSlice', () => {
  const createStore = () =>
    configureStore({ reducer: { projects: projectsReducer } });

  it('should have correct initial state', () => {
    const store = createStore();
    const state = store.getState().projects;
    expect(state.projects).toEqual([]);
    expect(state.activeProjectId).toBeNull();
    expect(state.loading).toBe(false);
  });

  it('should handle setActiveProject', () => {
    const store = createStore();
    store.dispatch(setActiveProject('proj-123'));
    expect(store.getState().projects.activeProjectId).toBe('proj-123');
  });

  it('should handle addProject', () => {
    const store = createStore();
    store.dispatch(addProject({
      projectId: 'proj-456',
      title: 'Tokyo Trip',
      description: null,
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }));
    expect(store.getState().projects.projects).toHaveLength(1);
    expect(store.getState().projects.projects[0].title).toBe('Tokyo Trip');
  });

  it('should handle clearProjects', () => {
    const store = createStore();
    store.dispatch(addProject({
      projectId: 'proj-789',
      title: 'Test',
      description: null,
      status: 'ACTIVE',
      createdAt: '2025-01-01T00:00:00Z',
      updatedAt: '2025-01-01T00:00:00Z',
    }));
    store.dispatch(setActiveProject('proj-789'));
    store.dispatch(clearProjects());
    expect(store.getState().projects.projects).toEqual([]);
    expect(store.getState().projects.activeProjectId).toBeNull();
  });
});
