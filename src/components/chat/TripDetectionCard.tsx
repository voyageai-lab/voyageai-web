import { useState } from 'react';
import { apiClient } from '@/api/client';
import type { DetectedBooking, GmailScanResponse } from '@/types';

const BOOKING_TYPE_CONFIG: Record<string, { icon: string; label: string; color: string; bg: string }> = {
  hotel: { icon: '🏨', label: 'Hotel', color: 'text-blue-700', bg: 'bg-blue-50' },
  flight: { icon: '✈️', label: 'Flight', color: 'text-sky-700', bg: 'bg-sky-50' },
  ticket: { icon: '🎫', label: 'Ticket', color: 'text-purple-700', bg: 'bg-purple-50' },
  other: { icon: '📧', label: 'Booking', color: 'text-gray-700', bg: 'bg-gray-50' },
};

interface TripDetectionCardProps {
  authProvider: string;
  onAddToTrip?: (booking: DetectedBooking) => void;
}

export function TripDetectionCard({ authProvider, onAddToTrip }: TripDetectionCardProps) {
  const [scanning, setScanning] = useState(false);
  const [bookings, setBookings] = useState<DetectedBooking[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState<Set<string>>(new Set());

  const isGoogleUser = authProvider === 'GOOGLE';

  if (!isGoogleUser) return null;

  const handleScan = async () => {
    setScanning(true);
    setError(null);
    try {
      const data = await apiClient.post<GmailScanResponse>('/gmail/scan-trips');
      setBookings(data.bookings);
    } catch (err: any) {
      setError(err.message || 'Failed to scan Gmail');
    } finally {
      setScanning(false);
    }
  };

  const handleDismiss = (emailId: string) => {
    setDismissed(prev => new Set(prev).add(emailId));
  };

  const visibleBookings = bookings?.filter(b => !dismissed.has(b.emailId) && b.type !== 'other') ?? [];

  if (bookings && visibleBookings.length === 0) {
    return null;
  }

  return (
    <div className="mx-4 my-2">
      {!bookings && (
        <button
          onClick={handleScan}
          disabled={scanning}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 hover:border-blue-300 hover:shadow-sm transition text-sm text-blue-700 w-full"
        >
          <span className="text-base">📬</span>
          {scanning ? (
            <span className="animate-pulse">Scanning your Gmail for travel bookings...</span>
          ) : (
            <span>Check Gmail for upcoming trips</span>
          )}
        </button>
      )}

      {error && (
        <p className="text-xs text-red-500 mt-1">{error}</p>
      )}

      {visibleBookings.length > 0 && (
        <div className="space-y-2 mt-2">
          <p className="text-[10px] text-gray-400 uppercase font-semibold tracking-wide">
            Detected Travel Bookings
          </p>
          {visibleBookings.map((booking) => {
            const config = BOOKING_TYPE_CONFIG[booking.type] || BOOKING_TYPE_CONFIG.other;
            return (
              <div
                key={booking.emailId}
                className={`${config.bg} border border-opacity-50 rounded-lg p-3 flex items-start gap-3`}
              >
                <span className="text-xl mt-0.5">{config.icon}</span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${config.color} truncate`}>
                    {booking.subject}
                  </p>
                  <div className="flex flex-wrap gap-1.5 mt-1">
                    <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-gray-500">
                      {config.label}
                    </span>
                    {booking.dates.slice(0, 2).map((d, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-gray-500">
                        {d}
                      </span>
                    ))}
                    {booking.locationHints.slice(0, 1).map((loc, i) => (
                      <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-gray-600 font-medium">
                        📍 {loc}
                      </span>
                    ))}
                    {booking.confirmationNumber && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/60 text-gray-500 font-mono">
                        #{booking.confirmationNumber}
                      </span>
                    )}
                  </div>
                  <div className="flex gap-1.5 mt-2">
                    <button
                      onClick={() => onAddToTrip?.(booking)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 transition font-medium"
                    >
                      Add to trip
                    </button>
                    <button
                      onClick={() => handleDismiss(booking.emailId)}
                      className="text-[11px] px-2.5 py-1 rounded-md bg-white text-gray-500 border border-gray-200 hover:bg-gray-50 transition"
                    >
                      Dismiss
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
