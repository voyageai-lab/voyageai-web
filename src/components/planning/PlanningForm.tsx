import { useState, type FormEvent } from 'react';
import { Send, Sparkles } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import { submitPlanning, resetPlanning } from '@/store/planningSlice';

export function PlanningForm() {
  const [requirements, setRequirements] = useState('');
  const dispatch = useAppDispatch();
  const { loading, status } = useAppSelector((s) => s.planning);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!requirements.trim()) return;
    dispatch(resetPlanning());
    dispatch(submitPlanning({ requirements: requirements.trim() }));
  };

  const isProcessing = loading || (status === 'PROCESSING');

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
      <div className="flex items-center gap-2 mb-4">
        <Sparkles className="w-5 h-5 text-blue-600" />
        <h2 className="text-lg font-semibold text-gray-900">Plan Your Trip</h2>
      </div>

      <form onSubmit={handleSubmit}>
        <textarea
          value={requirements}
          onChange={(e) => setRequirements(e.target.value)}
          placeholder="Describe your ideal trip... e.g., &quot;Plan a 5-day trip to Tokyo for 2 people with a $3000 budget. We love sushi, temples, and anime.&quot;"
          rows={4}
          className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition resize-none text-sm"
          disabled={isProcessing}
        />

        <div className="flex items-center justify-between mt-3">
          <span className="text-xs text-gray-400">
            {requirements.length} characters
          </span>
          <button
            type="submit"
            disabled={isProcessing || !requirements.trim()}
            className="flex items-center gap-2 bg-blue-600 text-white px-5 py-2.5 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition font-medium text-sm"
          >
            {isProcessing ? (
              <>
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                Generating...
              </>
            ) : (
              <>
                <Send className="w-4 h-4" />
                Generate Itinerary
              </>
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
