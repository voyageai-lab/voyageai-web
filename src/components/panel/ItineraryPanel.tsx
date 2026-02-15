import { useState, useMemo } from 'react';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAppSelector } from '@/store/hooks';
import type { Activity, DailyItinerary, StructuredItinerary, ToolTrace } from '@/types';

// Fix Leaflet default marker icon (broken in bundlers)
const defaultIcon = L.icon({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  iconRetinaUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});
L.Marker.prototype.options.icon = defaultIcon;

type TabType = 'itinerary' | 'map' | 'tools';

interface ItineraryPanelProps {
  onClose: () => void;
}

export function ItineraryPanel({ onClose }: ItineraryPanelProps) {
  const { itinerary, toolTrace } = useAppSelector((s) => s.chat);
  const [activeTab, setActiveTab] = useState<TabType>('itinerary');

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
          <TabButton
            label="Itinerary"
            active={activeTab === 'itinerary'}
            onClick={() => setActiveTab('itinerary')}
          />
          <TabButton
            label="Map"
            active={activeTab === 'map'}
            onClick={() => setActiveTab('map')}
          />
          {toolTrace.length > 0 && (
            <TabButton
              label={`Tools (${toolTrace.length})`}
              active={activeTab === 'tools'}
              onClick={() => setActiveTab('tools')}
            />
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
        ) : activeTab === 'map' ? (
          <MapContent itinerary={itinerary} />
        ) : (
          <ToolTraceContent traces={toolTrace} />
        )}
      </div>
    </div>
  );
}

function TabButton({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className={`px-3 py-1.5 rounded-lg text-sm font-medium transition ${
        active
          ? 'bg-blue-100 text-blue-700'
          : 'text-gray-500 hover:bg-gray-100'
      }`}
    >
      {label}
    </button>
  );
}

// ─── Map Content ──────────────────────────────────────────────

interface MarkerData {
  lat: number;
  lng: number;
  title: string;
  time: string;
  day: number;
  description: string;
}

function MapContent({ itinerary }: { itinerary: StructuredItinerary }) {
  const markers = useMemo(() => {
    const result: MarkerData[] = [];
    for (const day of itinerary.days) {
      for (const act of day.activities) {
        if (act.location?.latitude && act.location?.longitude) {
          result.push({
            lat: act.location.latitude,
            lng: act.location.longitude,
            title: act.title,
            time: act.time,
            day: day.dayNumber,
            description: act.location.name || act.description,
          });
        }
      }
    }
    return result;
  }, [itinerary]);

  if (markers.length === 0) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="text-center">
          <svg className="w-12 h-12 text-gray-300 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
          <p className="text-sm text-gray-400">No location coordinates available</p>
          <p className="text-xs text-gray-300 mt-1">Activities need latitude/longitude data to show on the map</p>
        </div>
      </div>
    );
  }

  // Calculate bounds center
  const centerLat = markers.reduce((sum, m) => sum + m.lat, 0) / markers.length;
  const centerLng = markers.reduce((sum, m) => sum + m.lng, 0) / markers.length;

  // Day colors for visual grouping
  const dayColors = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#EC4899', '#06B6D4', '#F97316'];

  return (
    <div className="h-full flex flex-col">
      <div className="flex-1 relative" style={{ minHeight: '400px' }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={12}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          {markers.map((marker, idx) => (
            <Marker key={idx} position={[marker.lat, marker.lng]}>
              <Popup>
                <div className="text-xs">
                  <p className="font-semibold" style={{ color: dayColors[(marker.day - 1) % dayColors.length] }}>
                    Day {marker.day}
                  </p>
                  <p className="font-medium mt-0.5">{marker.title}</p>
                  <p className="text-gray-500">{marker.time}</p>
                  <p className="text-gray-400 mt-0.5">{marker.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>

      {/* Legend */}
      <div className="border-t border-gray-200 p-3">
        <p className="text-xs text-gray-400 mb-2">{markers.length} locations plotted</p>
        <div className="flex flex-wrap gap-2">
          {itinerary.days.map((day) => (
            <span
              key={day.dayNumber}
              className="text-xs px-2 py-0.5 rounded-full border"
              style={{
                color: dayColors[(day.dayNumber - 1) % dayColors.length],
                borderColor: dayColors[(day.dayNumber - 1) % dayColors.length],
                backgroundColor: dayColors[(day.dayNumber - 1) % dayColors.length] + '10',
              }}
            >
              Day {day.dayNumber}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Itinerary Content ────────────────────────────────────────

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

// ─── Tool Trace Content ───────────────────────────────────────

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
