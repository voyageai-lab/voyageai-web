import { useState, useMemo, useEffect } from 'react';
import type { Activity, DailyItinerary, SourceLink, StructuredItinerary, TravelTip } from '@/types';
import { DAY_COLORS } from './ItineraryMapView';

interface ItineraryContentProps {
  itinerary: StructuredItinerary;
  selectedDay: number | null;
  onSelectDay: (day: number | null) => void;
}

export function ItineraryContent({
  itinerary,
  selectedDay,
  onSelectDay,
}: ItineraryContentProps) {
  const [expandedDay, setExpandedDay] = useState<number | null>(null);

  useEffect(() => {
    setExpandedDay(selectedDay);
  }, [selectedDay]);

  const visibleDays = useMemo(
    () =>
      selectedDay !== null
        ? itinerary.days.filter((d) => d.dayNumber === selectedDay)
        : itinerary.days,
    [itinerary.days, selectedDay],
  );

  return (
    <div className="p-4 space-y-3">
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

      {itinerary.travelTips && itinerary.travelTips.length > 0 && !selectedDay && (
        <TravelTipsPanel tips={itinerary.travelTips} />
      )}

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

      {!selectedDay && <RootExtras itinerary={itinerary} />}
    </div>
  );
}

export function DayCard({
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

  const weatherForecast = day.weatherForecast as string | undefined;
  const totalWalkingKm = day.totalWalkingKm as number | undefined;

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
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 mt-0.5">
              {weatherForecast && (
                <span className="text-[10px] text-sky-600 bg-sky-50 px-1.5 py-0.5 rounded">
                  {weatherForecast}
                </span>
              )}
              {totalWalkingKm != null && (
                <span className="text-[10px] text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
                  {totalWalkingKm} km walking
                </span>
              )}
            </div>
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
          {day.summary && (
            <p className="px-4 py-2 text-xs text-gray-500 bg-gray-50/50 italic">
              {day.summary}
            </p>
          )}
          {day.activities.map((activity, idx) => (
            <ActivityRow key={activity.activityId || idx} activity={activity} />
          ))}
        </div>
      )}
    </div>
  );
}

export function ActivityRow({ activity }: { activity: Activity }) {
  const categoryIcons: Record<string, string> = {
    SIGHTSEEING: '🏛️',
    DINING: '🍽️',
    ACCOMMODATION: '🏨',
    TRANSPORTATION: '🚌',
    SHOPPING: '🛍️',
    ENTERTAINMENT: '🎭',
  };

  const icon = activity.type ? categoryIcons[activity.type] || '📍' : '📍';
  const dist = activity.distanceFromPrevious;

  return (
    <>
      {dist && dist.km > 0 && (
        <div className="flex items-center gap-2 px-4 py-1.5 bg-slate-50/80">
          <div className="flex-1 border-t border-dashed border-slate-300" />
          <div className="flex items-center gap-1.5 text-[10px] text-slate-500 shrink-0">
            <TransportIcon mode={dist.transportMode} />
            <span className="font-medium">{dist.km} km</span>
            {dist.durationMinutes != null && (
              <span>({dist.durationMinutes} min)</span>
            )}
            {dist.transportDetail && (
              <span className="text-slate-400 max-w-[200px] truncate" title={dist.transportDetail}>
                {dist.transportDetail}
              </span>
            )}
            {dist.transitCost && (
              <span className="text-slate-400">{dist.transitCost}</span>
            )}
          </div>
          <div className="flex-1 border-t border-dashed border-slate-300" />
        </div>
      )}

      <div className="px-4 py-3 hover:bg-gray-50/50 transition">
        <div className="flex items-start gap-2">
          <span className="text-sm shrink-0 mt-0.5">{icon}</span>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5">
              <span className="text-xs text-blue-600 font-mono">
                {activity.time}
              </span>
              {activity.durationMinutes != null && (
                <span className="text-[10px] text-gray-400">
                  {activity.durationMinutes}min
                </span>
              )}
              {activity.estimatedCost && (
                <span className="text-xs text-gray-400">
                  {activity.estimatedCost}
                </span>
              )}
              {activity.rating != null && (
                <span className="text-[10px] text-amber-500 font-medium">
                  {'★'} {activity.rating}
                </span>
              )}
              {activity.cuisineType && (
                <span className="text-[10px] text-orange-500 bg-orange-50 px-1.5 rounded">
                  {activity.cuisineType}
                </span>
              )}
            </div>

            <p className="text-sm font-medium text-gray-900 mt-0.5">
              {activity.title}
            </p>

            <p className="text-xs text-gray-500 mt-0.5">
              {activity.description}
            </p>

            {activity.highlights && activity.highlights.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-1.5">
                {activity.highlights.map((h, i) => (
                  <span key={i} className="text-[10px] bg-purple-50 text-purple-600 px-1.5 py-0.5 rounded border border-purple-100">
                    {h}
                  </span>
                ))}
              </div>
            )}

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

            {activity.websiteUrl && (
              <a
                href={activity.websiteUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 mt-1.5 text-[11px] text-blue-600 hover:text-blue-800 hover:underline transition"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                </svg>
                Official Website
              </a>
            )}

            {activity.sourceLinks && activity.sourceLinks.length > 0 && (
              <SourceLinksSection links={activity.sourceLinks} />
            )}

            {activity.bookingRequired != null && (
              <p className="text-[10px] text-gray-500 mt-1">
                {activity.bookingRequired ? '🎫 Booking required' : '🎫 No booking needed'}
                {activity.reservationTip && ` — ${activity.reservationTip}`}
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

            <DynamicExtras activity={activity} />
          </div>
        </div>
      </div>
    </>
  );
}

// ── Source badge colors by source type ──────────────────────
const SOURCE_STYLES: Record<string, { bg: string; text: string; label: string }> = {
  official: { bg: 'bg-green-50', text: 'text-green-700', label: 'Official' },
  xiaohongshu: { bg: 'bg-red-50', text: 'text-red-600', label: '小红书' },
  foursquare: { bg: 'bg-blue-50', text: 'text-blue-600', label: 'Foursquare' },
  google_maps: { bg: 'bg-emerald-50', text: 'text-emerald-600', label: 'Google Maps' },
  web_search: { bg: 'bg-gray-100', text: 'text-gray-600', label: 'Web' },
};

function SourceLinksSection({ links }: { links: SourceLink[] }) {
  const [expanded, setExpanded] = useState(false);

  // Show first 2 links by default, rest when expanded
  const visibleLinks = expanded ? links : links.slice(0, 2);
  const hasMore = links.length > 2;

  return (
    <div className="mt-1.5">
      <button
        onClick={() => setExpanded(!expanded)}
        className="text-[10px] text-gray-500 font-medium hover:text-gray-700 flex items-center gap-1 transition"
      >
        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101M10.172 13.828a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
        </svg>
        References ({links.length})
        {hasMore && (
          <svg
            className={`w-3 h-3 transition-transform ${expanded ? 'rotate-180' : ''}`}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        )}
      </button>
      <div className="mt-1 space-y-1">
        {visibleLinks.map((link, i) => {
          const style = SOURCE_STYLES[link.source] ?? SOURCE_STYLES.web_search;
          return (
            <div key={i} className="flex items-start gap-1.5">
              <span className={`shrink-0 text-[9px] font-medium px-1.5 py-0.5 rounded ${style.bg} ${style.text}`}>
                {style.label}
              </span>
              <div className="min-w-0">
                <a
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[11px] text-blue-600 hover:text-blue-800 hover:underline inline-flex items-center gap-0.5 transition"
                >
                  <span className="truncate max-w-[220px]">{link.title}</span>
                  <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                </a>
                {link.snippet && (
                  <p className="text-[10px] text-gray-400 truncate max-w-[260px]">{link.snippet}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function TransportIcon({ mode }: { mode?: string }) {
  const m = (mode || '').toLowerCase();
  if (m.includes('walk') || m.includes('foot')) return <span>🚶</span>;
  if (m.includes('subway') || m.includes('metro') || m.includes('train') || m.includes('rail')) return <span>🚇</span>;
  if (m.includes('bus')) return <span>🚌</span>;
  if (m.includes('taxi') || m.includes('uber') || m.includes('cab') || m.includes('ride')) return <span>🚕</span>;
  if (m.includes('car') || m.includes('driv')) return <span>🚗</span>;
  if (m.includes('ferry') || m.includes('boat')) return <span>⛴️</span>;
  if (m.includes('fly') || m.includes('flight') || m.includes('plane')) return <span>✈️</span>;
  if (m.includes('bike') || m.includes('cycl')) return <span>🚲</span>;
  return <span>➜</span>;
}

function isUrl(value: unknown): value is string {
  if (typeof value !== 'string') return false;
  return /^https?:\/\//i.test(value);
}

function DynamicExtras({ activity }: { activity: Activity }) {
  const SKIP_KEYS = new Set([
    'activityId', 'activity_id', 'time', 'title', 'description', 'location', 'type',
    'estimatedCost', 'estimated_cost', 'tips', 'notes',
    'durationMinutes', 'duration_minutes',
    'distanceFromPrevious', 'distance_from_previous',
    'highlights', 'rating',
    'bookingRequired', 'booking_required',
    'bookingUrl', 'booking_url',
    'reservationTip', 'reservation_tip',
    'cuisineType', 'cuisine_type',
    'websiteUrl', 'website_url',
    'sourceLinks', 'source_links',
  ]);

  const extras = Object.entries(activity).filter(
    ([key, val]) => !SKIP_KEYS.has(key) && val != null && val !== '',
  );

  if (extras.length === 0) return null;

  return (
    <div className="mt-1.5 flex flex-wrap gap-1">
      {extras.map(([key, val]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase()).trim();

        if (isUrl(val)) {
          return (
            <a
              key={key}
              href={val}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-1.5 py-0.5 rounded transition"
              title={val}
            >
              <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
              </svg>
              {label}
            </a>
          );
        }

        if (Array.isArray(val) && val.length > 0 && val.every((v: unknown) => typeof v === 'object' && v !== null && 'url' in (v as Record<string, unknown>))) {
          return (
            <div key={key} className="w-full mt-0.5">
              <span className="text-[10px] text-gray-500 font-medium">{label}:</span>
              <div className="flex flex-wrap gap-1 mt-0.5">
                {val.slice(0, 3).map((item: Record<string, unknown>, i: number) => (
                  <a
                    key={i}
                    href={String(item.url)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-0.5 text-[10px] text-blue-600 hover:text-blue-800 hover:underline bg-blue-50 px-1.5 py-0.5 rounded transition truncate max-w-[200px]"
                    title={String(item.title ?? item.url)}
                  >
                    <svg className="w-2.5 h-2.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                    </svg>
                    {String(item.title ?? 'Link')}
                  </a>
                ))}
                {val.length > 3 && (
                  <span className="text-[10px] text-gray-400">+{val.length - 3} more</span>
                )}
              </div>
            </div>
          );
        }

        const display = typeof val === 'object' ? JSON.stringify(val) : String(val);
        return (
          <span
            key={key}
            className="text-[10px] text-gray-500 bg-gray-100 px-1.5 py-0.5 rounded"
            title={`${label}: ${display}`}
          >
            {label}: {display.length > 40 ? display.slice(0, 40) + '...' : display}
          </span>
        );
      })}
    </div>
  );
}

const TIP_CATEGORY_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string; border: string }> = {
  booking: { icon: '🎫', label: 'Booking', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  closure: { icon: '🚫', label: 'Closure', color: 'text-orange-700', bg: 'bg-orange-50', border: 'border-orange-200' },
  dress_code: { icon: '👔', label: 'Dress Code', color: 'text-purple-700', bg: 'bg-purple-50', border: 'border-purple-200' },
  safety: { icon: '⚠️', label: 'Safety', color: 'text-red-700', bg: 'bg-red-50', border: 'border-red-200' },
  logistics: { icon: '🕐', label: 'Logistics', color: 'text-blue-700', bg: 'bg-blue-50', border: 'border-blue-200' },
  budget: { icon: '💰', label: 'Budget', color: 'text-green-700', bg: 'bg-green-50', border: 'border-green-200' },
  cultural: { icon: '🎌', label: 'Cultural', color: 'text-indigo-700', bg: 'bg-indigo-50', border: 'border-indigo-200' },
};

const PRIORITY_STYLES: Record<string, string> = {
  high: 'font-semibold',
  medium: '',
  low: 'opacity-75',
};

function TravelTipsPanel({ tips }: { tips: TravelTip[] }) {
  const highPriority = tips.filter(t => t.priority === 'high');
  const otherTips = tips.filter(t => t.priority !== 'high');

  return (
    <div className="bg-amber-50 rounded-xl p-4 border border-amber-200">
      <h4 className="text-sm font-semibold text-amber-800 mb-3 flex items-center gap-1.5">
        <span>💡</span> Travel Tips & Reminders
        {highPriority.length > 0 && (
          <span className="text-[10px] bg-red-100 text-red-700 px-1.5 py-0.5 rounded-full font-medium">
            {highPriority.length} important
          </span>
        )}
      </h4>
      <div className="space-y-2">
        {[...highPriority, ...otherTips].map((tip, i) => {
          const config = TIP_CATEGORY_CONFIG[tip.category] || TIP_CATEGORY_CONFIG.logistics;
          const priorityClass = PRIORITY_STYLES[tip.priority || 'medium'] || '';
          return (
            <div
              key={i}
              className={`flex items-start gap-2 text-xs ${config.bg} ${config.border} border rounded-lg px-3 py-2`}
            >
              <span className="shrink-0 mt-0.5">{config.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-1.5 mb-0.5">
                  <span className={`text-[10px] font-medium ${config.color}`}>
                    {config.label}
                  </span>
                  {tip.priority === 'high' && (
                    <span className="text-[9px] bg-red-200 text-red-800 px-1 rounded">IMPORTANT</span>
                  )}
                  {tip.advanceDays != null && (
                    <span className="text-[9px] bg-amber-200 text-amber-800 px-1 rounded">
                      Book {tip.advanceDays}+ days ahead
                    </span>
                  )}
                </div>
                <p className={`${config.color} ${priorityClass}`}>{tip.message}</p>
                {tip.appliesTo && (
                  <p className="text-[10px] text-gray-400 mt-0.5">Applies to: {tip.appliesTo}</p>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

const ROOT_KNOWN_KEYS = new Set(['metadata', 'days', 'tips', 'travelTips', 'travel_tips']);

export function RootExtras({ itinerary }: { itinerary: StructuredItinerary }) {
  const extras = Object.entries(itinerary).filter(
    ([k, v]) => !ROOT_KNOWN_KEYS.has(k) && v != null,
  );
  if (extras.length === 0) return null;

  return (
    <>
      {extras.map(([key, val]) => {
        const label = key.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ')
          .replace(/^./, s => s.toUpperCase()).trim();

        if (Array.isArray(val) && val.every(v => typeof v === 'string')) {
          return (
            <div key={key} className="bg-indigo-50 rounded-xl p-4 border border-indigo-200">
              <h4 className="text-sm font-semibold text-indigo-800 mb-2">{label}</h4>
              <ul className="space-y-1">
                {val.map((item: string, i: number) => (
                  <li key={i} className="text-xs text-indigo-700 flex gap-2">
                    <span className="shrink-0">-</span>
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </div>
          );
        }

        if (typeof val === 'object' && !Array.isArray(val)) {
          return (
            <div key={key} className="bg-slate-50 rounded-xl p-4 border border-slate-200">
              <h4 className="text-sm font-semibold text-slate-700 mb-2">{label}</h4>
              <div className="space-y-1">
                {Object.entries(val as Record<string, unknown>).map(([k, v]) => (
                  <p key={k} className="text-xs text-slate-600">
                    <span className="font-medium">
                      {k.replace(/([A-Z])/g, ' $1').replace(/_/g, ' ').replace(/^./, s => s.toUpperCase()).trim()}:
                    </span>{' '}
                    {String(v)}
                  </p>
                ))}
              </div>
            </div>
          );
        }

        return (
          <div key={key} className="text-xs text-gray-500 px-1">
            <span className="font-medium">{label}:</span> {String(val)}
          </div>
        );
      })}
    </>
  );
}
