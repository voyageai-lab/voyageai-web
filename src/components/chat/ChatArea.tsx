import { useRef, useEffect, useState, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { submitPlanning, addUserMessage } from '@/store/chatSlice';
import { fetchProjects } from '@/store/projectsSlice';
import { useSSE } from '@/hooks/useSSE';
import { ChatInput } from './ChatInput';
import { MessageBubble } from './MessageBubble';
import { ShareDialog } from '@/components/share/ShareDialog';
import { CollaboratorPanel } from '@/components/collaboration/CollaboratorPanel';
import { PresenceAvatars } from '@/components/collaboration/PresenceAvatars';
import type { StructuredItinerary } from '@/types';

interface ChatAreaProps {
  onViewItinerary: (itinerary: StructuredItinerary, version: number, timestamp: string) => void;
}

export function ChatArea({ onViewItinerary }: ChatAreaProps) {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
  const { messages, currentTaskId, currentProjectId, loading } = useAppSelector((s) => s.chat);
  const { projects } = useAppSelector((s) => s.projects);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [showShareDialog, setShowShareDialog] = useState(false);
  const [showCollabPanel, setShowCollabPanel] = useState(false);

  const activeProject = projects.find((p) => p.projectId === (urlProjectId || currentProjectId));
  const isViewer = activeProject?.role === 'VIEWER';
  const isOwner = !activeProject || activeProject.role === 'OWNER';

  // Compute version numbers for itinerary messages (v1, v2, v3...)
  const itineraryVersionMap = useMemo(() => {
    const map = new Map<string, number>();
    let v = 0;
    for (const m of messages) {
      if (m.itinerary) {
        v++;
        map.set(m.id, v);
      }
    }
    return map;
  }, [messages]);

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
    })).then((result) => {
      // Refresh projects list (a new project may have been auto-created)
      dispatch(fetchProjects());

      // If a new project was created (we were on /chat without a projectId),
      // navigate to /chat/:projectId so the URL reflects the new project
      if (result.meta.requestStatus === 'fulfilled') {
        const payload = result.payload as { projectId: string };
        if (payload.projectId && payload.projectId !== urlProjectId) {
          navigate(`/chat/${payload.projectId}`, { replace: true });
        }
      }
    });
  };

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Project Header Bar */}
      {activeProject && (
        <div className="flex items-center justify-between px-4 py-2.5 bg-white border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h1 className="text-sm font-semibold text-gray-800 truncate">{activeProject.title}</h1>
            {activeProject.visibility !== 'PRIVATE' && (
              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                {activeProject.visibility === 'LINK_SHARED' ? 'Shared' : 'Public'}
              </span>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {isViewer && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-500">
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                </svg>
                View only
              </span>
            )}
            <PresenceAvatars projectId={activeProject.projectId} />
            {!isViewer && (
              <>
                <button
                  onClick={() => setShowCollabPanel(true)}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition"
                  title="Collaborators"
                >
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                  </svg>
                  Team
                </button>
                {isOwner && (
                  <button
                    onClick={() => setShowShareDialog(true)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 transition"
                    title="Share project"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
                    </svg>
                    Share
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSuggestionClick={isViewer ? undefined : handleSend} />
        ) : (
          <div className="max-w-3xl mx-auto py-6 px-4 space-y-6">
            {messages.map((msg) => {
              const version = msg.itinerary ? itineraryVersionMap.get(msg.id) ?? 0 : 0;
              return (
                <MessageBubble
                  key={msg.id}
                  message={msg}
                  itineraryVersion={version}
                  onViewItinerary={
                    msg.itinerary
                      ? () => onViewItinerary(msg.itinerary!, version, msg.timestamp)
                      : undefined
                  }
                />
              );
            })}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Input — hidden for VIEWER */}
      {isViewer ? (
        <div className="px-4 py-3 bg-gray-100 border-t border-gray-200 text-center">
          <p className="text-sm text-gray-500">
            You have <span className="font-medium">view-only</span> access to this project.
            Contact the owner to request edit permissions.
          </p>
        </div>
      ) : (
        <ChatInput onSend={handleSend} disabled={loading} />
      )}

      {/* Share Dialog */}
      {showShareDialog && activeProject && (
        <ShareDialog project={activeProject} onClose={() => setShowShareDialog(false)} />
      )}

      {/* Collaborator Panel */}
      {showCollabPanel && activeProject && (
        <CollaboratorPanel
          projectId={activeProject.projectId}
          onClose={() => setShowCollabPanel(false)}
        />
      )}
    </div>
  );
}

function EmptyState({ onSuggestionClick }: { onSuggestionClick?: (text: string) => void }) {
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
              onClick={() => onSuggestionClick?.(suggestion)}
              disabled={!onSuggestionClick}
              className={`px-4 py-3 bg-white border border-gray-200 rounded-xl text-sm text-gray-600 text-left transition ${
                onSuggestionClick
                  ? 'hover:border-blue-300 hover:bg-blue-50/50 cursor-pointer'
                  : 'opacity-60 cursor-not-allowed'
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
