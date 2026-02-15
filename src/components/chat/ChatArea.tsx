import { useRef, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { submitPlanning, addUserMessage } from '@/store/chatSlice';
import { fetchProjects } from '@/store/projectsSlice';
import { useSSE } from '@/hooks/useSSE';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';

interface ChatAreaProps {
  onViewItinerary: () => void;
}

export function ChatArea({ onViewItinerary }: ChatAreaProps) {
  const dispatch = useAppDispatch();
  const { messages, currentTaskId, currentProjectId, loading } = useAppSelector((s) => s.chat);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // SSE connection for real-time updates
  useSSE(currentTaskId);

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = (text: string) => {
    // Add user message to chat
    dispatch(addUserMessage(text));
    // Submit to backend - pass projectId if we're in an existing project
    dispatch(submitPlanning({
      requirements: text,
      ...(currentProjectId ? { projectId: currentProjectId } : {}),
    })).then(() => {
      // Refresh projects list (a new project may have been auto-created)
      dispatch(fetchProjects());
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={handleSend} />
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {messages.map((msg) => (
              <MessageBubble
                key={msg.id}
                message={msg}
                onViewItinerary={msg.itinerary ? onViewItinerary : undefined}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input */}
      <ChatInput onSend={handleSend} disabled={loading} />
    </div>
  );
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick: (text: string) => void }) {
  return (
    <div className="flex-1 flex items-center justify-center h-full">
      <div className="text-center max-w-md px-4">
        <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h2 className="text-2xl font-bold text-gray-900 mb-2">VoyageAI Travel Planner</h2>
        <p className="text-gray-500 mb-8">
          Describe your dream trip and I&apos;ll create a detailed day-by-day itinerary with real-time data.
        </p>
        <div className="grid grid-cols-1 gap-3 text-left">
          {[
            'Plan a 5-day trip to Tokyo for cherry blossom season with $2000 budget',
            'Weekend getaway to Paris: focus on food and art',
            '7 days in Iceland: Northern Lights, glaciers, and hot springs',
          ].map((suggestion) => (
            <button
              key={suggestion}
              onClick={() => onSuggestionClick(suggestion)}
              className="px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 hover:border-blue-300 hover:bg-blue-50/50 transition cursor-pointer text-left"
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
