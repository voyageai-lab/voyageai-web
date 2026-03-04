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
import type { StructuredItinerary } from '@/types';

interface SelectedItinerary {
  itinerary: StructuredItinerary;
  version: number;
  timestamp: string;
}

export function AppLayout() {
  const dispatch = useAppDispatch();
  const { projectId: urlProjectId } = useParams<{ projectId?: string }>();
  const [selected, setSelected] = useState<SelectedItinerary | null>(null);
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
      setSelected(null);
    } else {
      // URL is /chat (no projectId) → reset to new chat
      dispatch(setActiveProject(null));
      dispatch(resetChat());
      setSelected(null);
    }
  }, [urlProjectId, dispatch]);

  // Auto-show panel when a new itinerary arrives from generation (null → object)
  useEffect(() => {
    if (itinerary && !prevItineraryRef.current) {
      setSelected({
        itinerary,
        version: 0,
        timestamp: new Date().toISOString(),
      });
    }
    // Hide panel if itinerary is removed (e.g. project switch cleared it)
    if (!itinerary && prevItineraryRef.current) {
      setSelected(null);
    }
    prevItineraryRef.current = itinerary;
  }, [itinerary]);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar */}
      <Sidebar />

      {/* Chat Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea
          onViewItinerary={(it, version, timestamp) =>
            setSelected({ itinerary: it, version, timestamp })
          }
        />
      </div>

      {/* Itinerary Panel (collapsible) */}
      {selected && (
        <ItineraryPanel
          itinerary={selected.itinerary}
          version={selected.version}
          timestamp={selected.timestamp}
          onClose={() => setSelected(null)}
        />
      )}
    </div>
  );
}
