import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import type { StructuredItinerary, ToolTrace } from '@/types';
import { MapSection, ItineraryContent } from '@/components/itinerary';

const META_KNOWN_KEYS = new Set([
  'destination', 'startDate', 'endDate', 'totalDays', 'budget', 'interests',
]);

interface ItineraryPanelProps {
  itinerary: StructuredItinerary;
  version: number;
  timestamp: string;
  onClose: () => void;
  onEditRequest?: (prompt: string) => void;
}

export function ItineraryPanel({ itinerary, version, timestamp, onClose, onEditRequest }: ItineraryPanelProps) {
  const { toolTrace } = useAppSelector((s) => s.chat);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showTools, setShowTools] = useState(false);

  return (
    <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <PanelHeader
        itinerary={itinerary}
        version={version}
        timestamp={timestamp}
        onClose={onClose}
        toolTraceCount={toolTrace.length}
        showTools={showTools}
        onToggleTools={() => setShowTools(!showTools)}
      />

      {/* Unified content: Map + Itinerary */}
      <div className="flex-1 overflow-y-auto min-h-0">
        {showTools ? (
          <ToolTraceContent traces={toolTrace} />
        ) : (
          <>
            <MapSection
              itinerary={itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
            <ItineraryContent
              itinerary={itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              onEditRequest={onEditRequest}
            />
          </>
        )}
      </div>
    </div>
  );
}

// ─── Panel Header ─────────────────────────────────────────────

function PanelHeader({
  itinerary,
  version,
  timestamp,
  onClose,
  toolTraceCount,
  showTools,
  onToggleTools,
}: {
  itinerary: StructuredItinerary;
  version: number;
  timestamp: string;
  onClose: () => void;
  toolTraceCount: number;
  showTools: boolean;
  onToggleTools: () => void;
}) {
  const meta = itinerary.metadata;
  const formattedTime = new Date(timestamp).toLocaleString([], {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <div className="border-b border-gray-200 shrink-0">
      {/* Title row */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h2 className="text-base font-bold text-gray-900 truncate">
              {meta.destination}
            </h2>
            {version > 0 && (
              <span className="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-50 text-blue-600 border border-blue-100 shrink-0">
                v{version}
              </span>
            )}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
            {version > 0 && (
              <span className="text-xs text-gray-400">
                Generated {formattedTime}
              </span>
            )}
            <span className="text-xs text-gray-500">
              {meta.startDate} — {meta.endDate}
            </span>
            <span className="text-xs text-gray-500">{meta.totalDays} days</span>
            {meta.budget && (
              <span className="text-xs text-gray-500">{meta.budget}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 ml-3 shrink-0">
          {toolTraceCount > 0 && (
            <button
              onClick={onToggleTools}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                showTools
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Tools ({toolTraceCount})
            </button>
          )}
          <button
            onClick={onClose}
            className="p-1.5 text-gray-400 hover:text-gray-600 transition rounded"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Interests + meta extras */}
      <div className="px-5 pb-2 flex flex-wrap gap-1.5">
        {meta.interests && meta.interests.map((interest) => (
          <span
            key={interest}
            className="px-2 py-0.5 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100"
          >
            {interest}
          </span>
        ))}
        {Object.entries(meta)
          .filter(([k, v]) => !META_KNOWN_KEYS.has(k) && v != null && typeof v !== 'object')
          .map(([key, val]) => (
            <span
              key={key}
              className="px-2 py-0.5 bg-gray-50 rounded-full text-xs text-gray-500 border border-gray-200"
            >
              {key.replace(/([A-Z])/g, ' $1').toLowerCase()}: {String(val)}
            </span>
          ))}
      </div>
    </div>
  );
}

// ─── Tool Trace Content ───────────────────────────────────────

function ToolTraceContent({ traces }: { traces: ToolTrace[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs text-gray-400 mb-3">
        {traces.length} tool{traces.length !== 1 ? 's' : ''} called during
        generation
      </p>
      {traces.map((trace, idx) => (
        <div
          key={idx}
          className="border border-gray-200 rounded-lg overflow-hidden"
        >
          <button
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            className="w-full flex items-center gap-2 px-3 py-2 text-left hover:bg-gray-50 transition"
          >
            <span
              className={`w-2 h-2 rounded-full shrink-0 ${
                trace.success ? 'bg-green-500' : 'bg-red-500'
              }`}
            />
            <span className="text-sm font-mono text-gray-800 flex-1 truncate">
              {trace.tool}
            </span>
            <span className="text-xs text-gray-400">{trace.latency_ms}ms</span>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${
                expandedIdx === idx ? 'rotate-180' : ''
              }`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </button>
          {expandedIdx === idx && (
            <div className="px-3 pb-3 border-t border-gray-100">
              <pre className="text-xs text-gray-600 bg-gray-50 rounded p-2 overflow-x-auto mt-2">
                {JSON.stringify(trace.arguments, null, 2)}
              </pre>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
