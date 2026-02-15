import { Loader2, CheckCircle, XCircle } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

export function ProgressBar() {
  const { status, progress, progressMessage, sseConnected } = useAppSelector(
    (s) => s.planning,
  );

  if (!status || status === 'PENDING') return null;

  const isComplete = status === 'COMPLETED';
  const isFailed = status === 'FAILED';

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          {isComplete ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
          ) : isFailed ? (
            <XCircle className="w-5 h-5 text-red-600" />
          ) : (
            <Loader2 className="w-5 h-5 text-blue-600 animate-spin" />
          )}
          <span className="text-sm font-medium text-gray-700">
            {isComplete
              ? 'Itinerary Ready!'
              : isFailed
                ? 'Generation Failed'
                : 'Generating Itinerary...'}
          </span>
        </div>
        <div className="flex items-center gap-2">
          {sseConnected && (
            <span className="flex items-center gap-1 text-xs text-green-600">
              <span className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
              Live
            </span>
          )}
          <span className="text-sm font-medium text-gray-500">{progress}%</span>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-gray-200 rounded-full h-2.5 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-500 ${
            isComplete
              ? 'bg-green-500'
              : isFailed
                ? 'bg-red-500'
                : 'bg-blue-600'
          }`}
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>

      {/* Status message */}
      {progressMessage && (
        <p className="mt-2 text-xs text-gray-500">{progressMessage}</p>
      )}
    </div>
  );
}
