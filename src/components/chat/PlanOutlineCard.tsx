interface DayTheme {
  day: number;
  theme: string;
  highlight?: string;
}

interface PlanOutlineData {
  summary?: string;
  daily_themes?: DayTheme[];
  estimated_budget?: string;
  weather_summary?: string;
}

interface PlanOutlineCardProps {
  data: PlanOutlineData;
}

/**
 * Visual plan outline card displayed before full itinerary generation.
 *
 * Shows the day-by-day theme overview, budget, and weather summary.
 * Rendered inside the AgentActivityFeed when a plan_outline event arrives.
 */
export function PlanOutlineCard({ data }: PlanOutlineCardProps) {
  const { summary, daily_themes, estimated_budget, weather_summary } = data;

  return (
    <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center gap-2">
        <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center">
          <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
        </div>
        <h4 className="font-semibold text-blue-900 text-sm">Plan Outline</h4>
      </div>

      {/* Summary */}
      {summary && (
        <p className="text-sm text-gray-700">{summary}</p>
      )}

      {/* Day themes */}
      {daily_themes && daily_themes.length > 0 && (
        <div className="space-y-1.5">
          {daily_themes.map((dt) => (
            <div key={dt.day} className="flex items-start gap-2">
              <span className="flex-shrink-0 w-7 h-7 rounded-full bg-white border border-blue-200 flex items-center justify-center text-xs font-bold text-blue-600">
                {dt.day}
              </span>
              <div className="pt-0.5">
                <span className="text-sm font-medium text-gray-800">{dt.theme}</span>
                {dt.highlight && (
                  <span className="text-xs text-blue-600 ml-1.5">— {dt.highlight}</span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Budget & weather row */}
      <div className="flex flex-wrap gap-3 pt-1">
        {estimated_budget && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/60 rounded-full px-2.5 py-1 border border-gray-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            {estimated_budget}
          </div>
        )}
        {weather_summary && (
          <div className="flex items-center gap-1.5 text-xs text-gray-600 bg-white/60 rounded-full px-2.5 py-1 border border-gray-200">
            <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
            {weather_summary}
          </div>
        )}
      </div>
    </div>
  );
}
