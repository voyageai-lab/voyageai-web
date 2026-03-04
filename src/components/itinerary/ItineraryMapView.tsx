import { useMemo, useEffect } from 'react';
import { MapContainer, TileLayer, Marker, Popup, Polyline, useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type { StructuredItinerary } from '@/types';

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

export const DAY_COLORS = [
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

export function createNumberedIcon(dayNumber: number, highlight = false, activityIndex?: number) {
  const color = DAY_COLORS[(dayNumber - 1) % DAY_COLORS.length];
  const label = activityIndex != null ? `${dayNumber}-${activityIndex}` : `${dayNumber}`;
  const fontSize = label.length > 2 ? 9 : 12;
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
        <text x="14" y="18" text-anchor="middle" font-size="${fontSize}" font-weight="bold" fill="${color}">${label}</text>
      </svg>
    `,
  });
}

export interface MarkerData {
  lat: number;
  lng: number;
  title: string;
  time: string;
  day: number;
  description: string;
  activityIdx: number;
}

function FitBounds({ markers }: { markers: MarkerData[] }) {
  const map = useMap();

  useEffect(() => {
    if (markers.length === 0) return;
    const bounds = L.latLngBounds(markers.map((m) => [m.lat, m.lng]));
    map.fitBounds(bounds, { padding: [40, 40], maxZoom: 13 });
  }, [markers, map]);

  return null;
}

interface MapSectionProps {
  itinerary: StructuredItinerary;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
  mapHeight?: string;
}

export function MapSection({
  itinerary,
  selectedDay,
  onSelectDay,
  mapHeight = '340px',
}: MapSectionProps) {
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

      {/* Map — z-index constrained to avoid overlapping modals/dialogs */}
      <div style={{ height: mapHeight, position: 'relative', zIndex: 0 }}>
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
              key={`${marker.day}-${marker.activityIdx}`}
              position={[marker.lat, marker.lng]}
              icon={createNumberedIcon(
                marker.day,
                selectedDay === marker.day,
                marker.activityIdx + 1,
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
                    Day {marker.day} &middot; Stop {marker.activityIdx + 1}
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
