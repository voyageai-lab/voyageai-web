import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/authSlice';
import planningReducer, { setProgress, setCompleted, setFailed } from '@/store/planningSlice';
import { Navbar } from '@/components/layout/Navbar';
import { PlanningForm } from '@/components/planning/PlanningForm';
import { ProgressBar } from '@/components/planning/ProgressBar';
import type { Itinerary } from '@/types';

function createTestStore(preloadedState?: Record<string, unknown>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      planning: planningReducer,
    },
    preloadedState: preloadedState as never,
  });
}

function renderWithProviders(
  ui: React.ReactElement,
  store = createTestStore(),
) {
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>,
  );
}

// ==============================
// Navbar Tests
// ==============================

describe('Navbar', () => {
  it('shows login and register links when not authenticated', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('Login')).toBeDefined();
    expect(screen.getByText('Get Started')).toBeDefined();
  });

  it('shows VoyageAI brand', () => {
    renderWithProviders(<Navbar />);
    expect(screen.getByText('VoyageAI')).toBeDefined();
  });
});

// ==============================
// PlanningForm Tests
// ==============================

describe('PlanningForm', () => {
  it('renders the form with textarea and button', () => {
    renderWithProviders(<PlanningForm />);
    expect(screen.getByPlaceholderText(/describe your ideal trip/i)).toBeDefined();
    expect(screen.getByText('Generate Itinerary')).toBeDefined();
  });

  it('shows character count', () => {
    renderWithProviders(<PlanningForm />);
    expect(screen.getByText('0 characters')).toBeDefined();
  });
});

// ==============================
// ProgressBar Tests
// ==============================

describe('ProgressBar', () => {
  it('does not render when status is null', () => {
    const { container } = renderWithProviders(<ProgressBar />);
    expect(container.firstChild).toBeNull();
  });

  it('renders when processing', () => {
    const store = createTestStore();
    store.dispatch(
      setProgress({ status: 'PROCESSING', progress: 50, message: 'Working...' }),
    );
    renderWithProviders(<ProgressBar />, store);
    expect(screen.getByText('Generating Itinerary...')).toBeDefined();
    expect(screen.getByText('50%')).toBeDefined();
    expect(screen.getByText('Working...')).toBeDefined();
  });

  it('shows completed state', () => {
    const store = createTestStore();
    const mockItinerary: Itinerary = {
      destination: 'Tokyo',
      startDate: '2025-07-01',
      endDate: '2025-07-05',
      totalBudget: 3000,
      currency: 'USD',
      travelers: 2,
      summary: 'test',
      days: [],
    };
    store.dispatch(setCompleted({ itinerary: mockItinerary }));
    renderWithProviders(<ProgressBar />, store);
    expect(screen.getByText('Itinerary Ready!')).toBeDefined();
    expect(screen.getByText('100%')).toBeDefined();
  });

  it('shows failed state', () => {
    const store = createTestStore();
    store.dispatch(setFailed('Timeout'));
    renderWithProviders(<ProgressBar />, store);
    expect(screen.getByText('Generation Failed')).toBeDefined();
  });
});
