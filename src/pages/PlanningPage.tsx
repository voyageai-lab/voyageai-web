import { Navigate } from 'react-router-dom';
import { useAppSelector } from '@/store/hooks';
import { useSSE } from '@/hooks/useSSE';
import { PlanningForm } from '@/components/planning/PlanningForm';
import { ProgressBar } from '@/components/planning/ProgressBar';
import { ItineraryDisplay } from '@/components/planning/ItineraryDisplay';
import { ToolTracePanel } from '@/components/planning/ToolTracePanel';

export function PlanningPage() {
  const { token } = useAppSelector((s) => s.auth);
  const { taskId, error } = useAppSelector((s) => s.planning);

  // Connect SSE when a task is submitted
  useSSE(taskId);

  if (!token) {
    return <Navigate to="/login" replace />;
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">AI Travel Planner</h1>
        <p className="text-gray-500 mt-1">
          Describe your dream trip and our AI will create a detailed itinerary with real-time data.
        </p>
      </div>

      <PlanningForm />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      <ProgressBar />
      <ToolTracePanel />
      <ItineraryDisplay />
    </div>
  );
}
