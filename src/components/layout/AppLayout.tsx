import { useState, useEffect, useRef } from 'react';
import { Sidebar } from './Sidebar';
import { ChatArea } from '@/components/chat/ChatArea';
import { ItineraryPanel } from '@/components/panel/ItineraryPanel';
import { useAppSelector } from '@/store/hooks';

export function AppLayout() {
  const [showPanel, setShowPanel] = useState(false);
  const { itinerary } = useAppSelector((s) => s.chat);
  const prevItineraryRef = useRef(itinerary);

  // Auto-show panel when itinerary arrives (from null → object)
  useEffect(() => {
    if (itinerary && !prevItineraryRef.current) {
      setShowPanel(true);
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
