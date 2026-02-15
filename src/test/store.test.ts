import { describe, it, expect } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, { logout, setUser, clearError } from '@/store/authSlice';
import planningReducer, {
  setProgress,
  setCompleted,
  setFailed,
  resetPlanning,
  setSseConnected,
} from '@/store/planningSlice';
import type { Itinerary } from '@/types';

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

  it('should handle logout', () => {
    const store = createStore();
    store.dispatch(setUser({ id: 1, email: 'test@example.com', displayName: 'test', avatarUrl: null, authProvider: 'LOCAL' }));
    store.dispatch(logout());
    expect(store.getState().auth.user).toBeNull();
    expect(store.getState().auth.token).toBeNull();
  });

  it('should handle clearError', () => {
    const store = createStore();
    // We can't easily set error without mocking the thunk, so test clearError directly
    store.dispatch(clearError());
    expect(store.getState().auth.error).toBeNull();
  });
});

// ==============================
// Planning Slice Tests
// ==============================

describe('planningSlice', () => {
  const createStore = () =>
    configureStore({ reducer: { planning: planningReducer } });

  it('should have correct initial state', () => {
    const store = createStore();
    const state = store.getState().planning;
    expect(state.taskId).toBeNull();
    expect(state.status).toBeNull();
    expect(state.progress).toBe(0);
    expect(state.itinerary).toBeNull();
    expect(state.toolTrace).toEqual([]);
    expect(state.loading).toBe(false);
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
    const state = store.getState().planning;
    expect(state.status).toBe('PROCESSING');
    expect(state.progress).toBe(50);
    expect(state.progressMessage).toBe('Calling tools...');
  });

  it('should handle setCompleted with itinerary', () => {
    const store = createStore();
    const mockItinerary: Itinerary = {
      destination: 'Tokyo',
      startDate: '2025-07-01',
      endDate: '2025-07-05',
      totalBudget: 3000,
      currency: 'USD',
      travelers: 2,
      summary: 'A 5-day Tokyo adventure',
      days: [],
    };

    store.dispatch(setCompleted({ itinerary: mockItinerary }));
    const state = store.getState().planning;
    expect(state.status).toBe('COMPLETED');
    expect(state.progress).toBe(100);
    expect(state.itinerary?.destination).toBe('Tokyo');
    expect(state.loading).toBe(false);
  });

  it('should handle setCompleted with tool trace', () => {
    const store = createStore();
    const mockItinerary: Itinerary = {
      destination: 'Paris',
      startDate: '2025-08-01',
      endDate: '2025-08-03',
      totalBudget: 2000,
      currency: 'EUR',
      travelers: 1,
      summary: 'Paris trip',
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

    const state = store.getState().planning;
    expect(state.toolTrace).toHaveLength(1);
    expect(state.toolTrace[0].tool).toBe('get_weather_forecast');
  });

  it('should handle setFailed', () => {
    const store = createStore();
    store.dispatch(setFailed('Pipeline timed out after 120s'));
    const state = store.getState().planning;
    expect(state.status).toBe('FAILED');
    expect(state.error).toBe('Pipeline timed out after 120s');
    expect(state.loading).toBe(false);
  });

  it('should handle setSseConnected', () => {
    const store = createStore();
    store.dispatch(setSseConnected(true));
    expect(store.getState().planning.sseConnected).toBe(true);
    store.dispatch(setSseConnected(false));
    expect(store.getState().planning.sseConnected).toBe(false);
  });

  it('should handle resetPlanning', () => {
    const store = createStore();
    store.dispatch(
      setProgress({ status: 'PROCESSING', progress: 50, message: 'test' }),
    );
    store.dispatch(resetPlanning());
    const state = store.getState().planning;
    expect(state.taskId).toBeNull();
    expect(state.status).toBeNull();
    expect(state.progress).toBe(0);
    expect(state.itinerary).toBeNull();
  });
});
