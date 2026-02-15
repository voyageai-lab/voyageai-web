import {
  MapPin,
  Clock,
  DollarSign,
  Calendar,
  Users,
  Lightbulb,
} from 'lucide-react';
import { useAppSelector } from '@/store/hooks';
import type { Activity, ItineraryDay } from '@/types';

export function ItineraryDisplay() {
  const { itinerary } = useAppSelector((s) => s.planning);

  if (!itinerary) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl p-6 text-white">
        <h2 className="text-2xl font-bold mb-2">{itinerary.destination}</h2>
        <p className="text-blue-100 mb-4">{itinerary.summary}</p>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 text-sm">
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-200" />
            <span>
              {itinerary.startDate} — {itinerary.endDate}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <DollarSign className="w-4 h-4 text-blue-200" />
            <span>
              {itinerary.currency} {itinerary.totalBudget?.toLocaleString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-200" />
            <span>{itinerary.travelers} travelers</span>
          </div>
          <div className="flex items-center gap-2">
            <Calendar className="w-4 h-4 text-blue-200" />
            <span>{itinerary.days?.length || 0} days</span>
          </div>
        </div>
      </div>

      {/* Days */}
      {itinerary.days?.map((day) => (
        <DayCard key={day.dayNumber} day={day} currency={itinerary.currency} />
      ))}
    </div>
  );
}

function DayCard({ day, currency }: { day: ItineraryDay; currency: string }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Day header */}
      <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold text-gray-900">
              Day {day.dayNumber}: {day.theme}
            </h3>
            <span className="text-xs text-gray-500">{day.date}</span>
          </div>
          <span className="text-sm font-medium text-blue-600">
            {currency} {day.dailyBudget?.toLocaleString()}
          </span>
        </div>
      </div>

      {/* Activities */}
      <div className="divide-y divide-gray-100">
        {day.activities?.map((activity, idx) => (
          <ActivityRow key={idx} activity={activity} currency={currency} />
        ))}
      </div>
    </div>
  );
}

function ActivityRow({
  activity,
  currency,
}: {
  activity: Activity;
  currency: string;
}) {
  return (
    <div className="px-6 py-4 hover:bg-gray-50 transition-colors">
      <div className="flex items-start gap-4">
        {/* Time */}
        <div className="flex-shrink-0 w-16 text-center">
          <span className="text-sm font-medium text-blue-600">{activity.time}</span>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h4 className="font-medium text-gray-900 text-sm">{activity.name}</h4>
            <span className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">
              {activity.category}
            </span>
          </div>

          <p className="text-sm text-gray-600 mb-2">{activity.description}</p>

          <div className="flex flex-wrap items-center gap-3 text-xs text-gray-500">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              {activity.location}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {activity.duration}
            </span>
            <span className="flex items-center gap-1">
              <DollarSign className="w-3 h-3" />
              {currency} {activity.cost}
            </span>
          </div>

          {activity.tips && (
            <div className="mt-2 flex items-start gap-1.5 text-xs text-amber-700 bg-amber-50 px-3 py-2 rounded-lg">
              <Lightbulb className="w-3 h-3 mt-0.5 flex-shrink-0" />
              {activity.tips}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
