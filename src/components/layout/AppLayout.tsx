import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { ItineraryPanel } from '@/components/panel/ItineraryPanel';
import { useAppSelector, useAppDispatch } from '@/store/hooks';
import { setActiveProject } from '@/store/projectsSlice';
import {
  clearChatForProject,
  loadConversationHistory,
  setCurrentProjectId,
  resetChat,
} from '@/store/chatSlice';

export function AppLayout() {
  const dispatch = useAppDispatch();
  const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
  const [showPanel, setShowPanel] = useState(false);
  const { itinerary, currentProjectId, currentTaskId } = useAppSelector(
    (s) => s.chat,
  );
  const prevItineraryRef = useRef(itinerary);

  // Use refs to read the latest Redux values inside the effect
  // without adding them to the dependency array (which would cause infinite loops).
  const currentProjectIdRef = useRef(currentProjectId);
  const currentTaskIdRef = useRef(currentTaskId);
  currentProjectIdRef.current = currentProjectId;
  currentTaskIdRef.current = currentTaskId;

  // Sync URL param → Redux state
  useEffect(() => {
    if (urlProjectId) {
      // Skip if we just created this project and have an active task
      // (SSE is delivering live updates — don't clear & reload)
      if (
        urlProjectId === currentProjectIdRef.current &&
        currentTaskIdRef.current
      ) {
        // Just sync the sidebar highlight
        dispatch(setActiveProject(urlProjectId));
        return;
      }

      // URL has a projectId → load the project data
      dispatch(clearChatForProject());
      dispatch(setActiveProject(urlProjectId));
      dispatch(setCurrentProjectId(urlProjectId));
      dispatch(loadConversationHistory(urlProjectId));
    } else {
      // URL is /chat (no projectId) → reset to new chat
      dispatch(setActiveProject(null));
      dispatch(resetChat());
    }
  }, [urlProjectId, dispatch]);

  // Auto-show panel when itinerary arrives (from null → object)
  useEffect(() => {
    if (itinerary && !prevItineraryRef.current) {
      setShowPanel(true);
    }
    // Hide panel if itinerary is removed (e.g. project switch cleared it)
    if (!itinerary && prevItineraryRef.current) {
      setShowPanel(false);
    }
    prevItineraryRef.current = itinerary;
  }, [itinerary]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea onViewItinerary={() => setShowPanel(true)} />
      </div>

      {/* Itinerary Panel (collapsible) */}
      {showPanel && itinerary && (
        <ItineraryPanel onClose={() => setShowPanel(false)} />
      )}
    </div>
  );
}
