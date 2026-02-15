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
 */

import type { StructuredItinerary, ItineraryMetadata, DailyItinerary, Activity, Location } from '@/types';

/* eslint-disable @typescript-eslint/no-explicit-any */

/**
 * Normalizes a raw parsed JSON object into a properly-typed StructuredItinerary.
 * Handles both snake_case (Python) and camelCase (Java/Jackson) field names.
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
  }));
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
  };
}
