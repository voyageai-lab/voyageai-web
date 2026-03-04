import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import type { SharedProjectResponse, StructuredItinerary } from '@/types';
import { MapSection, ItineraryContent } from '@/components/itinerary';

const BASE_URL = '/api';

interface ConversationMessage {
  role: string;
  content: string;
  structuredData?: string;
}

interface HistoryResponse {
  projectId: string;
  messages: ConversationMessage[];
  totalCount: number;
}

/**
 * Public page for viewing a shared project with full itinerary + map.
 * No authentication required — fetches data via share token.
 */
export function SharedViewPage() {
  const { token } = useParams<{ token: string }>();
  const [project, setProject] = useState<SharedProjectResponse | null>(null);
  const [itinerary, setItinerary] = useState<StructuredItinerary | null>(null);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;

    const load = async () => {
      try {
        const projRes = await fetch(`${BASE_URL}/shared/${token}`);
        if (!projRes.ok) throw new Error(await projRes.text());
        const projData: SharedProjectResponse = await projRes.json();
        setProject(projData);

        const histRes = await fetch(`${BASE_URL}/shared/${token}/history`);
        if (histRes.ok) {
          const histData: HistoryResponse = await histRes.json();
          const itineraryMsg = [...histData.messages]
            .reverse()
            .find((m) => m.structuredData);
          if (itineraryMsg?.structuredData) {
            try {
              const parsed = JSON.parse(itineraryMsg.structuredData);
              setItinerary(parsed);
            } catch {
              // Not valid JSON
            }
          }
        }
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Failed to load');
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [token]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-gray-400 text-sm">Loading shared trip...</p>
        </div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center max-w-md mx-4">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.878 9.878L3 3m6.878 6.878l4.242 4.242" />
            </svg>
          </div>
          <h1 className="text-xl font-semibold text-gray-900 mb-2">Link Unavailable</h1>
          <p className="text-gray-500 mb-6">{error || 'This shared link is invalid or has been revoked.'}</p>
          <Link to="/login" className="inline-block px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition">
            Go to VoyageAI
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-[1000]">
        <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-900">VoyageAI</span>
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">Shared Trip</span>
          </div>
          <Link to="/login" className="text-sm text-blue-600 hover:text-blue-800 font-medium">
            Sign in to plan your own trip &rarr;
          </Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {/* Project info card */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">{project.title}</h1>
          {project.description && <p className="text-gray-600 mb-4">{project.description}</p>}
          <div className="flex items-center gap-3 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              {project.ownerAvatarUrl ? (
                <img src={project.ownerAvatarUrl} alt="" className="w-6 h-6 rounded-full" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-blue-600 text-white flex items-center justify-center text-xs font-medium">
                  {project.ownerDisplayName?.[0]?.toUpperCase() || '?'}
                </div>
              )}
              <span>by {project.ownerDisplayName || 'Anonymous'}</span>
            </div>
            <span className="text-gray-300">|</span>
            <span>Updated {new Date(project.updatedAt).toLocaleDateString()}</span>
          </div>
        </div>

        {/* Itinerary with map */}
        {itinerary ? (
          <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
            {/* Itinerary header */}
            {itinerary.metadata && (
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-lg font-bold text-gray-900">
                  {itinerary.metadata.destination}
                </h2>
                <div className="flex flex-wrap items-center gap-x-3 gap-y-0.5 mt-1">
                  {itinerary.metadata.startDate && (
                    <span className="text-xs text-gray-500">
                      {itinerary.metadata.startDate} — {itinerary.metadata.endDate}
                    </span>
                  )}
                  {itinerary.metadata.totalDays && (
                    <span className="text-xs text-gray-500">
                      {itinerary.metadata.totalDays} days
                    </span>
                  )}
                  {itinerary.metadata.budget && (
                    <span className="text-xs text-gray-500">
                      {itinerary.metadata.budget}
                    </span>
                  )}
                </div>
                {itinerary.metadata.interests && itinerary.metadata.interests.length > 0 && (
                  <div className="flex flex-wrap gap-1.5 mt-2">
                    {itinerary.metadata.interests.map((interest) => (
                      <span
                        key={interest}
                        className="px-2 py-0.5 bg-blue-50 rounded-full text-xs text-blue-700 border border-blue-100"
                      >
                        {interest}
                      </span>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Map */}
            <MapSection
              itinerary={itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
              mapHeight="420px"
            />

            {/* Day-by-day content */}
            <ItineraryContent
              itinerary={itinerary}
              selectedDay={selectedDay}
              onSelectDay={setSelectedDay}
            />
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <p className="text-gray-500 text-sm">No itinerary generated yet for this trip.</p>
            <p className="text-gray-400 text-xs mt-1">The owner is still planning — check back soon!</p>
          </div>
        )}
      </main>
    </div>
  );
}
