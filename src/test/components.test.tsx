import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Provider } from 'react-redux';
import { BrowserRouter } from 'react-router-dom';
import { configureStore } from '@reduxjs/toolkit';
import authReducer from '@/store/authSlice';
import chatReducer from '@/store/chatSlice';
import projectsReducer from '@/store/projectsSlice';
import { ChatInput } from '@/components/chat/ChatInput';
import { MessageBubble } from '@/components/chat/MessageBubble';
import type { ChatMessage } from '@/types';

function createTestStore(preloadedState?: Record<string, unknown>) {
  return configureStore({
    reducer: {
      auth: authReducer,
      chat: chatReducer,
      projects: projectsReducer,
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
// ChatInput Tests
// ==============================

describe('ChatInput', () => {
  it('renders textarea and send button', () => {
    const onSend = () => {};
    renderWithProviders(<ChatInput onSend={onSend} />);
    expect(screen.getByPlaceholderText(/describe your dream trip/i)).toBeDefined();
  });

  it('calls onSend when form is submitted', () => {
    let sentMessage = '';
    const onSend = (msg: string) => { sentMessage = msg; };
    renderWithProviders(<ChatInput onSend={onSend} />);

    const textarea = screen.getByPlaceholderText(/describe your dream trip/i);
    fireEvent.change(textarea, { target: { value: 'Plan a trip to Tokyo' } });
    fireEvent.submit(textarea.closest('form')!);

    expect(sentMessage).toBe('Plan a trip to Tokyo');
  });

  it('disables when disabled prop is true', () => {
    renderWithProviders(<ChatInput onSend={() => {}} disabled />);
    const textarea = screen.getByPlaceholderText(/describe your dream trip/i);
    expect((textarea as HTMLTextAreaElement).disabled).toBe(true);
  });
});

// ==============================
// MessageBubble Tests
// ==============================

describe('MessageBubble', () => {
  it('renders user message with correct styling', () => {
    const msg: ChatMessage = {
      id: 'msg-1',
      role: 'user',
      content: 'Plan a trip to Tokyo',
      timestamp: new Date().toISOString(),
    };
    renderWithProviders(<MessageBubble message={msg} />);
    expect(screen.getByText('Plan a trip to Tokyo')).toBeDefined();
  });

  it('renders assistant message', () => {
    const msg: ChatMessage = {
      id: 'msg-2',
      role: 'assistant',
      content: 'Here is your itinerary!',
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
    };
    renderWithProviders(<MessageBubble message={msg} />);
    expect(screen.getByText('Here is your itinerary!')).toBeDefined();
  });

  it('renders processing state with spinner', () => {
    const msg: ChatMessage = {
      id: 'msg-3',
      role: 'assistant',
      content: 'Planning...',
      timestamp: new Date().toISOString(),
      status: 'PROCESSING',
      progress: 50,
      progressMessage: 'Calling tools...',
    };
    renderWithProviders(<MessageBubble message={msg} />);
    expect(screen.getByText('Calling tools...')).toBeDefined();
  });

  it('shows View Itinerary button when completed with itinerary', () => {
    const msg: ChatMessage = {
      id: 'msg-4',
      role: 'assistant',
      content: 'Done!',
      timestamp: new Date().toISOString(),
      status: 'COMPLETED',
      itinerary: {
        metadata: {
          destination: 'Tokyo',
          startDate: '2025-01-01',
          endDate: '2025-01-05',
          totalDays: 5,
          budget: '$3000',
          interests: [],
        },
        days: [],
      },
    };
    const onView = () => {};
    renderWithProviders(<MessageBubble message={msg} onViewItinerary={onView} />);
    expect(screen.getByText('View Itinerary')).toBeDefined();
  });

  it('shows error state for failed messages', () => {
    const msg: ChatMessage = {
      id: 'msg-5',
      role: 'assistant',
      content: 'Error occurred',
      timestamp: new Date().toISOString(),
      status: 'FAILED',
    };
    renderWithProviders(<MessageBubble message={msg} />);
    expect(screen.getByText('Generation failed')).toBeDefined();
  });
});
