import { useState, useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
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

// Day colors for visual grouping
const DAY_COLORS = [
  '#3B82F6',
  '#EF4444',
  '#10B981',
  '#F59E0B',
  '#8B5CF6',
  '#EC4899',
  '#06B6D4',
  '#F97316',
  '#6366F1',
  '#14B8A6',
];

function createNumberedIcon(dayNumber: number, highlight = false) {
  const color = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
  const size = highlight ? 34 : 28;
  const anchor = highlight ? 17 : 14;
  const anchorY = highlight ? 44 : 36;
  return L.divIcon({
    className: '',
    iconSize: [size, anchorY],
    iconAnchor: [anchor, anchorY],
    popupAnchor: [0, -anchorY],
    html: `
      <svg width="${size}" height="${anchorY}" viewBox="0 0 28 36" xmlns="http://www.w3.org/2000/svg">
        <path d="M14 0C6.3 0 0 6.3 0 14c0 10.5 14 22 14 22s14-11.5 14-22C28 6.3 21.7 0 14 0z" fill="${color}"${highlight ? ' stroke="white" stroke-width="2"' : ''}/>
        <circle cx="14" cy="14" r="10" fill="white"/>
        <text x="14" y="18" text-anchor="middle" font-size="12" font-weight="bold" fill="${color}">${dayNumber}</text>
      </svg>
    `,
  });
}

interface ItineraryPanelProps {
  onClose: () => void;
}

export function ItineraryPanel({ onClose }: ItineraryPanelProps) {
  const { itinerary, toolTrace } = useAppSelector((s) => s.chat);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [showTools, setShowTools] = useState(false);

  if (!itinerary) {
    return (
      <div className="w-1/2 border-l border-gray-200 bg-white flex items-center justify-center">
        <p className="text-gray-400 text-sm">No itinerary yet</p>
      </div>
    );
  }

  return (
    <div className="w-1/2 border-l border-gray-200 bg-white flex flex-col h-full">
      {/* Header */}
      <PanelHeader
        itinerary={itinerary}
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
            {/* Map Section */}
            <MapSection
              itinerary={itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />

            {/* Itinerary Section */}
            <ItineraryContent
              itinerary={itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
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
  onClose,
  toolTraceCount,
  showTools,
  onToggleTools,
}: {
  itinerary: StructuredItinerary;
  onClose: () => void;
  toolTraceCount: number;
  showTools: boolean;
  onToggleTools: () => void;
}) {
  const meta = itinerary.metadata;

  return (
    <div className="border-b border-gray-200 shrink-0">
      {/* Title row */}
      <div className="flex items-center justify-between px-5 pt-3 pb-1">
        <div className="flex-1 min-w-0">
          <h2 className="text-base font-bold text-gray-900 truncate">
            {meta.destination}
          </h2>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-0.5">
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

      {/* Interests tags */}
      {meta.interests && meta.interests.length > 0 && (
        <div className="px-5 pb-2 flex flex-wrap gap-1.5">
          {meta.interests.map((interest) => (
            <span
              key={interest}
              className="px-2 py-0.5 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100"
            >
              {interest}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Fit Bounds Component ─────────────────────────────────────

function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [markers, map]);

  return null;
}

// ─── Map Section ──────────────────────────────────────────────

interface MarkerData {
  lat: number;
  lng: number;
  title: string;
  time: string;
  day: number;
  description: string;
  activityIdx: number;
}

function MapSection({
  itinerary,
  selectedDay,
  onSelectDay,
}: {
  itinerary: StructuredItinerary;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}) {
  const allMarkers = useMemo(() => {
    const result: MarkerData[] = [];
    for (const day of itinerary.days) {
      for (let i = 0; i < day.activities.length; i++) {
        const act = day.activities[i];
        if (act.location?.latitude && act.location?.longitude) {
          result.push({
            lat: act.location.latitude,
            lng: act.location.longitude,
            title: act.title,
            time: act.time,
            day: day.dayNumber,
            description: act.location.name || act.description,
            activityIdx: i,
          });
        }
      }
    }
    return result;
  }, [itinerary]);

  const visibleMarkers = useMemo(
    () =>
      selectedDay !== null
        ? allMarkers.filter((m) => m.day === selectedDay)
        : allMarkers,
    [allMarkers, selectedDay],
  );

  const polylines = useMemo(() => {
    const lines: { day: number; positions: [number, number][] }[] = [];
    const grouped = new Map<number, MarkerData[]>();
    for (const m of visibleMarkers) {
      if (!grouped.has(m.day)) grouped.set(m.day, []);
      grouped.get(m.day)!.push(m);
    }
    for (const [day, ms] of grouped) {
      if (ms.length >= 2) {
        const sorted = [...ms].sort((a, b) => a.activityIdx - b.activityIdx);
        lines.push({
          day,
          positions: sorted.map((m) => [m.lat, m.lng]),
        });
      }
    }
    return lines;
  }, [visibleMarkers]);

  if (allMarkers.length === 0) {
    return (
      <div className="bg-gray-50 border-b border-gray-200 px-5 py-6 text-center">
        <svg
          className="w-8 h-8 text-gray-300 mx-auto mb-2"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"
          />
        </svg>
        <p className="text-xs text-gray-400">No coordinates available for map</p>
      </div>
    );
  }

  const centerLat =
    allMarkers.reduce((s, m) => s + m.lat, 0) / allMarkers.length;
  const centerLng =
    allMarkers.reduce((s, m) => s + m.lng, 0) / allMarkers.length;

  return (
    <div className="border-b border-gray-200">
      {/* Day filter bar */}
      <div className="px-4 py-2 flex flex-wrap gap-1.5 bg-white border-b border-gray-100">
        <button
          onClick={() => onSelectDay(null)}
          className={`text-xs px-2.5 py-1 rounded-full border transition ${
            selectedDay === null
              ? 'bg-gray-900 text-white border-gray-900'
              : 'text-gray-500 border-gray-300 hover:bg-gray-50'
          }`}
        >
          All Days
        </button>
        {itinerary.days.map((day) => {
          const color = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];
          const active = selectedDay === day.dayNumber;
          return (
            <button
              key={day.dayNumber}
              onClick={() => onSelectDay(active ? null : day.dayNumber)}
              className="text-xs px-2.5 py-1 rounded-full border transition"
              style={{
                color: active ? 'white' : color,
                borderColor: color,
                backgroundColor: active ? color : color + '10',
              }}
            >
              Day {day.dayNumber}
            </button>
          );
        })}
        <span className="text-xs text-gray-400 ml-auto self-center">
          {visibleMarkers.length} location
          {visibleMarkers.length !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Map */}
      <div style={{ height: '340px' }}>
        <MapContainer
          center={[centerLat, centerLng]}
          zoom={6}
          style={{ height: '100%', width: '100%' }}
          scrollWheelZoom={true}
        >
          <TileLayer
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
          />
          <FitBounds markers={visibleMarkers} />

          {polylines.map((line) => (
            <Polyline
              key={`line-${line.day}`}
              positions={line.positions}
              pathOptions={{
                color: DAY_COLORS[(line.day - 1) % DAY_COLORS.length],
                weight: 3,
                opacity: 0.6,
                dashArray: '8, 6',
              }}
            />
          ))}

          {visibleMarkers.map((marker, idx) => (
            <Marker
              key={`${marker.day}-${idx}`}
              position={[marker.lat, marker.lng]}
              icon={createNumberedIcon(
                marker.day,
                selectedDay === marker.day,
              )}
            >
              <Popup>
                <div className="text-xs min-w-[160px]">
                  <p
                    className="font-semibold text-sm"
                    style={{
                      color:
                        DAY_COLORS[(marker.day - 1) % DAY_COLORS.length],
                    }}
                  >
                    Day {marker.day}
                  </p>
                  <p className="font-medium mt-1">{marker.title}</p>
                  <p className="text-gray-500">{marker.time}</p>
                  <p className="text-gray-400 mt-1">{marker.description}</p>
                </div>
              </Popup>
            </Marker>
          ))}
        </MapContainer>
      </div>
    </div>
  );
}

// ─── Itinerary Content ────────────────────────────────────────

function ItineraryContent({
  itinerary,
  selectedDay,
  onSelectDay,
}: {
  itinerary: StructuredItinerary;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  // When map day filter changes, auto-expand that day in the itinerary
  useEffect(() => {
    setExpandedDay(selectedDay);
  }, [selectedDay]);

  // Filter days if a specific day is selected
  const visibleDays = useMemo(
    () =>
      selectedDay !== null
        ? itinerary.days.filter((d) => d.dayNumber === selectedDay)
        : itinerary.days,
    [itinerary.days, selectedDay],
  );

  return (
    <div className="p-4 space-y-3">
      {/* Days */}
      {visibleDays.map((day) => (
        <DayCard
          key={day.dayNumber}
          day={day}
          expanded={
            selectedDay !== null ||
            expandedDay === null ||
            expandedDay === day.dayNumber
          }
          onToggle={() => {
            if (selectedDay !== null) {
              // If filtering by day, clicking toggles back to all days
              onSelectDay(null);
            } else {
              setExpandedDay(
                expandedDay === day.dayNumber ? null : day.dayNumber,
              );
            }
          }}
          onDayClick={() => onSelectDay(day.dayNumber)}
        />
      ))}

      {/* Tips */}
      {itinerary.tips && itinerary.tips.length > 0 && !selectedDay && (
        <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
          <h4 className="text-sm font-semibold text-amber-800 mb-2">
            Travel Tips
          </h4>
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

function DayCard({
  day,
  expanded,
  onToggle,
  onDayClick,
}: {
  day: DailyItinerary;
  expanded: boolean;
  onToggle: () => void;
  onDayClick: () => void;
}) {
  const color = DAY_COLORS[(day.dayNumber - 1) % DAY_COLORS.length];

  return (
    <div className="border border-gray-200 rounded-xl overflow-hidden">
      <button
        onClick={onToggle}
        className="w-full bg-gray-50 px-4 py-2.5 border-b border-gray-200 flex items-center justify-between text-left hover:bg-gray-100 transition"
      >
        <div className="flex items-center gap-2">
          <span
            onClick={(e) => {
              e.stopPropagation();
              onDayClick();
            }}
            className="w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold text-white shrink-0 cursor-pointer hover:ring-2 hover:ring-offset-1 transition"
            style={{ backgroundColor: color, ['--tw-ring-color' as string]: color }}
            title={`Show Day ${day.dayNumber} on map`}
          >
            {day.dayNumber}
          </span>
          <div>
            <h4 className="text-sm font-semibold text-gray-900">
              Day {day.dayNumber}
              {day.theme && (
                <span className="font-normal text-gray-500 ml-1.5">
                  — {day.theme}
                </span>
              )}
            </h4>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-500">{day.date}</span>
          <svg
            className={`w-4 h-4 text-gray-400 transition-transform ${expanded ? 'rotate-180' : ''}`}
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
        </div>
      </button>
      {expanded && (
        <div className="divide-y divide-gray-100">
          {day.activities.map((activity, idx) => (
            <ActivityRow key={activity.activityId || idx} activity={activity} />
          ))}
        </div>
      )}
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
            <span className="text-xs text-blue-600 font-mono">
              {activity.time}
            </span>
            {activity.estimatedCost && (
              <span className="text-xs text-gray-400">
                {activity.estimatedCost}
              </span>
            )}
          </div>
          <p className="text-sm font-medium text-gray-900 mt-0.5">
            {activity.title}
          </p>
          <p className="text-xs text-gray-500 mt-0.5">
            {activity.description}
          </p>
          {activity.location && (
            <p className="text-xs text-gray-400 mt-1 flex items-center gap-1">
              <svg
                className="w-3 h-3"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
              {activity.location.name}
              {activity.location.address && ` - ${activity.location.address}`}
            </p>
          )}
          {activity.tips && (
            <p className="text-xs text-amber-600 mt-1">Tip: {activity.tips}</p>
          )}
          {activity.notes && activity.notes.length > 0 && (
            <div className="mt-1">
              {activity.notes.map((note, i) => (
                <p key={i} className="text-xs text-amber-600">
                  - {note}
                </p>
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
