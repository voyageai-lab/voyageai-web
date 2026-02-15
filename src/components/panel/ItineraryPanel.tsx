import { useState } from 'react';
import { useAppSelector } from '@/store/hooks';
import type { Activity, DailyItinerary, StructuredItinerary, ToolTrace } from '@/types';

interface ItineraryPanelProps {
  onClose: () => void;
}

export function ItineraryPanel({ onClose }: ItineraryPanelProps) {
  const { itinerary, toolTrace } = useAppSelector((s) => s.chat);
  const [activeTab, setActiveTab] = useState<'itinerary' | 'tools'>('itinerary');

  if (!itinerary) {
    return (
      <div className="w-[420px] border-l border-gray-200 bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">No itinerary yet</p>
      </div>
    );
  }

  return (
    <div className="w-[420px] border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-200">
        <div className="flex gap-1">
          <button
            onClick={() => setActiveTab('itinerary')}
            className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
              activeTab === 'itinerary'
                ? 'bg-blue-100 text-blue-700'
                : 'text-gray-500 hover:bg-gray-100'
            }`}
          >
            Itinerary
          </button>
          {toolTrace.length > 0 && (
            <button
              onClick={() => setActiveTab('tools')}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
                activeTab === 'tools'
                  ? 'bg-blue-100 text-blue-700'
                  : 'text-gray-500 hover:bg-gray-100'
              }`}
            >
              Tools ({toolTrace.length})
            </button>
          )}
        </div>
        <button
          onClick={onClose}
          className="p-1.5 text-gray-400 hover:text-gray-600 transition rounded"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto">
        {activeTab === 'itinerary' ? (
          <ItineraryContent itinerary={itinerary} />
        ) : (
          <ToolTraceContent traces={toolTrace} />
        )}
      </div>
    </div>
  );
}

function ItineraryContent({ itinerary }: { itinerary: StructuredItinerary }) {
  const meta = itinerary.metadata;

  return (
    <div className="p-4 space-y-4">
      {/* Header Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-xl p-4 border border-blue-100">
        <h3 className="text-lg font-bold text-gray-900">{meta.destination}</h3>
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 text-xs text-gray-600">
          <span>{meta.startDate} - {meta.endDate}</span>
          <span>{meta.totalDays} days</span>
          {meta.budget && <span>Budget: {meta.budget}</span>}
        </div>
        {meta.interests && meta.interests.length > 0 && (
          <div className="mt-2 flex flex-wrap gap-1.5">
            {meta.interests.map((interest) => (
              <span
                key={interest}
                className="px-2 py-0.5 bg-white/80 rounded-full text-xs text-blue-700 border border-blue-200"
              >
                {interest}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Days */}
      {itinerary.days.map((day) => (
        <DayCard key={day.dayNumber} day={day} />
      ))}

      {/* Tips */}
      {itinerary.tips && itinerary.tips.length > 0 && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">Travel Tips</h4>
          <ul className="space-y-1">
            {itinerary.tips.map((tip, i) => (
              <li key={i} className="text-xs text-amber-700 flex gap-2">
                <span className="shrink-0">-</span>
                <span>{tip}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}

function DayCard({ day }: { day: DailyItinerary }) {
  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <div className="bg-gray-50 px-4 py-2.5 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <h4 className="text-sm font-semibold text-gray-900">Day {day.dayNumber}</h4>
          <span className="text-xs text-gray-500">{day.date}</span>
        </div>
        {day.theme && (
          <p className="text-xs text-gray-500 mt-0.5">{day.theme}</p>
        )}
      </div>
      <div className="divide-y divide-gray-100">
        {day.activities.map((activity, idx) => (
          <ActivityRow key={activity.activityId || idx} activity={activity} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({ activity }: { activity: Activity }) {
  const categoryIcons: Record<string, string> = {
    SIGHTSEEING: '🏛️',
    DINING: '🍽️',
    ACCOMMODATION: '🏨',
    TRANSPORTATION: '🚌',
    SHOPPING: '🛍️',
    ENTERTAINMENT: '🎭',
  };

  const icon = activity.type ? categoryIcons[activity.type] || '📍' : '📍';

  return (
    <div className="px-4 py-3 hover:bg-gray-50/50 transition">
      <div className="flex items-start gap-2">
        <span className="text-sm shrink-0 mt-0.5">{icon}</span>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs text-blue-600 font-mono">{activity.time}</span>
            {activity.estimatedCost && (
              <span className="text-xs text-gray-400">{activity.estimatedCost}</span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 mt-0.5">{activity.title}</p>
          <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{activity.description}</p>
          {/* Location - rendered as Location object, not string */}
          {activity.location && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              {activity.location.name}
              {activity.location.address && ` - ${activity.location.address}`}
            </p>
          )}
          {/* Tips / Notes */}
          {activity.tips && (
            <p className="text-xs text-amber-600 mt-1">Tip: {activity.tips}</p>
          )}
          {activity.notes && activity.notes.length > 0 && (
            <div className="mt-1">
              {activity.notes.map((note, i) => (
                <p key={i} className="text-xs text-amber-600">- {note}</p>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ToolTraceContent({ traces }: { traces: ToolTrace[] }) {
  const [expandedIdx, setExpandedIdx] = useState<number | null>(null);

  return (
    <div className="p-4 space-y-2">
      <p className="text-xs text-gray-400 mb-3">
        {traces.length} tool{traces.length !== 1 ? 's' : ''} called during generation
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
            <span className={`w-2 h-2 rounded-full shrink-0 ${trace.success ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm font-mono text-gray-800 flex-1 truncate">{trace.tool}</span>
            <span className="text-xs text-gray-400">{trace.latency_ms}ms</span>
            <svg
              className={`w-3.5 h-3.5 text-gray-400 transition-transform ${expandedIdx === idx ? 'rotate-180' : ''}`}
              fill="none" stroke="currentColor" viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
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
