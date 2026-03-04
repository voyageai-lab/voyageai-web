/**
 * Normalizes a raw itinerary object to handle snake_case → camelCase field mapping.
 *
 * The Python Pydantic backend outputs snake_case JSON (e.g., day_number, total_days),
 * while the Java Jackson backend outputs camelCase (via @JsonAlias deserialization).
 * The frontend TypeScript types expect camelCase.
 *
 * This normalizer reads both variants so the frontend works regardless of data source:
 * - SSE real-time path (Jackson camelCase) ✓
 * - Conversation history path (raw Python snake_case) ✓
 * - HTTP polling fallback ✓
 *
 * IMPORTANT: The schema is flexible — the AI can add arbitrary extra fields.
 * Unknown fields are preserved (with snake_case → camelCase conversion) so
 * the frontend can render them dynamically.
 */

import type { StructuredItinerary, ItineraryMetadata, DailyItinerary, Activity, Location, DistanceInfo, SourceLink } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

// ── Generic snake_case → camelCase helper ──────────────────

function snakeToCamel(s: string): string {
  return s.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/**
 * Recursively converts all snake_case keys to camelCase.
 * Handles nested objects and arrays.
 */
function deepCamelCase(obj: any): any {
  if (Array.isArray(obj)) return obj.map(deepCamelCase);
  if (obj !== null && typeof obj === 'object' && !(obj instanceof Date)) {
    const result: Record<string, any> = {};
    for (const [key, value] of Object.entries(obj)) {
      result[snakeToCamel(key)] = deepCamelCase(value);
    }
    return result;
  }
  return obj;
}

/**
 * Extract "extra" fields from a raw object — any keys NOT in the known set.
 * Returned keys are camelCased.
 */
function extractExtras(raw: any, knownKeys: Set<string>): Record<string, unknown> {
  const extras: Record<string, unknown> = {};
  if (!raw || typeof raw !== 'object') return extras;
  for (const [key, value] of Object.entries(raw)) {
    const camel = snakeToCamel(key);
    if (!knownKeys.has(key) && !knownKeys.has(camel)) {
      extras[camel] = deepCamelCase(value);
    }
  }
  return extras;
}

// ── Known field sets ───────────────────────────────────────

const KNOWN_ROOT = new Set(['metadata', 'days', 'tips']);
const KNOWN_META = new Set([
  'destination', 'startDate', 'start_date', 'endDate', 'end_date',
  'totalDays', 'total_days', 'budget', 'interests',
]);
const KNOWN_DAY = new Set([
  'dayNumber', 'day_number', 'date', 'theme', 'activities', 'summary',
]);
const KNOWN_ACTIVITY = new Set([
  'activityId', 'activity_id', 'time', 'title', 'description', 'location',
  'type', 'estimatedCost', 'estimated_cost', 'tips', 'notes',
  'durationMinutes', 'duration_minutes', 'distanceFromPrevious', 'distance_from_previous',
  'highlights', 'rating', 'bookingRequired', 'booking_required',
  'bookingUrl', 'booking_url', 'reservationTip', 'reservation_tip',
  'cuisineType', 'cuisine_type',
  'websiteUrl', 'website_url', 'sourceLinks', 'source_links',
]);
const KNOWN_LOCATION = new Set([
  'name', 'latitude', 'longitude', 'address', 'placeType', 'place_type',
]);

// ── Normalizers ────────────────────────────────────────────

/**
 * Normalizes a raw parsed JSON object into a properly-typed StructuredItinerary.
 * Handles both snake_case (Python) and camelCase (Java/Jackson) field names.
 * Preserves all extra AI-generated fields.
 */
export function normalizeItinerary(raw: any): StructuredItinerary | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  try {
    const metadata = normalizeMetadata(raw.metadata);
    const days = normalizeDays(raw.days);

    if (!metadata || !days || days.length === 0) return undefined;

    return {
      metadata,
      days,
      tips: Array.isArray(raw.tips) ? raw.tips : [],
      ...extractExtras(raw, KNOWN_ROOT),
    };
  } catch {
    return undefined;
  }
}

function normalizeMetadata(raw: any): ItineraryMetadata | undefined {
  if (!raw || typeof raw !== 'object') return undefined;

  return {
    destination: raw.destination ?? '',
    startDate: raw.startDate ?? raw.start_date ?? '',
    endDate: raw.endDate ?? raw.end_date ?? '',
    totalDays: raw.totalDays ?? raw.total_days ?? 0,
    budget: raw.budget ?? '',
    interests: Array.isArray(raw.interests) ? raw.interests : [],
    ...extractExtras(raw, KNOWN_META),
  };
}

function normalizeDays(raw: any): DailyItinerary[] | undefined {
  if (!Array.isArray(raw)) return undefined;

  return raw.map((day: any, index: number) => ({
    dayNumber: day.dayNumber ?? day.day_number ?? (index + 1),
    date: day.date ?? '',
    theme: day.theme ?? '',
    activities: normalizeActivities(day.activities),
    summary: day.summary,
    ...extractExtras(day, KNOWN_DAY),
  }));
}

function normalizeActivities(raw: any): Activity[] {
  if (!Array.isArray(raw)) return [];

  return raw.map((act: any, index: number) => ({
    activityId: act.activityId ?? act.activity_id ?? `act-${index}`,
    time: act.time ?? '',
    title: act.title ?? '',
    description: act.description ?? '',
    location: normalizeLocation(act.location),
    type: act.type,
    estimatedCost: act.estimatedCost ?? act.estimated_cost,
    tips: act.tips,
    notes: Array.isArray(act.notes) ? act.notes : undefined,
    durationMinutes: act.durationMinutes ?? act.duration_minutes,
    distanceFromPrevious: normalizeDistance(act.distanceFromPrevious ?? act.distance_from_previous),
    highlights: Array.isArray(act.highlights) ? act.highlights : undefined,
    rating: act.rating,
    bookingRequired: act.bookingRequired ?? act.booking_required,
    bookingUrl: act.bookingUrl ?? act.booking_url,
    reservationTip: act.reservationTip ?? act.reservation_tip,
    cuisineType: act.cuisineType ?? act.cuisine_type,
    websiteUrl: act.websiteUrl ?? act.website_url,
    sourceLinks: normalizeSourceLinks(act.sourceLinks ?? act.source_links),
    ...extractExtras(act, KNOWN_ACTIVITY),
  }));
}

function normalizeSourceLinks(raw: any): SourceLink[] | undefined {
  if (!Array.isArray(raw) || raw.length === 0) return undefined;

  return raw
    .filter((link: any) => link && typeof link === 'object' && link.url)
    .map((link: any) => ({
      title: link.title ?? '',
      url: link.url,
      source: link.source ?? 'web_search',
      snippet: link.snippet,
    }));
}

function normalizeDistance(raw: any): DistanceInfo | undefined {
  if (!raw || typeof raw !== 'object') return undefined;
  return {
    km: raw.km ?? 0,
    transportMode: raw.transportMode ?? raw.transport_mode,
    transportDetail: raw.transportDetail ?? raw.transport_detail,
    durationMinutes: raw.durationMinutes ?? raw.duration_minutes,
    transitCost: raw.transitCost ?? raw.transit_cost,
  };
}

function normalizeLocation(raw: any): Location {
  if (!raw || typeof raw !== 'object') {
    return { name: '', latitude: 0, longitude: 0 };
  }

  return {
    name: raw.name ?? '',
    latitude: raw.latitude ?? 0,
    longitude: raw.longitude ?? 0,
    address: raw.address,
    placeType: raw.placeType ?? raw.place_type,
    ...extractExtras(raw, KNOWN_LOCATION),
  };
}
