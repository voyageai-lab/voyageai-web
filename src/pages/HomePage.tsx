import { Link } from 'react-router-dom';
import { Plane, Sparkles, Zap, Shield } from 'lucide-react';
import { useAppSelector } from '@/store/hooks';

export function HomePage() {
  const { token } = useAppSelector((s) => s.auth);

  return (
    <div className="max-w-5xl mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-blue-50 text-blue-700 px-4 py-2 rounded-full text-sm font-medium mb-6">
          <Sparkles className="w-4 h-4" />
          AI-Powered Travel Planning
        </div>
        <h1 className="text-5xl font-bold text-gray-900 mb-4">
          Plan Your Perfect Trip
          <br />
          <span className="text-blue-600">in Seconds</span>
        </h1>
        <p className="text-xl text-gray-500 max-w-2xl mx-auto mb-8">
          Tell us where you want to go and our AI agent will create a detailed day-by-day
          itinerary using real-time weather, currency, and location data.
        </p>
        <Link
          to={token ? '/planning' : '/register'}
          className="inline-flex items-center gap-2 bg-blue-600 text-white px-8 py-3.5 rounded-xl hover:bg-blue-700 transition text-lg font-medium shadow-lg shadow-blue-200"
        >
          <Plane className="w-5 h-5" />
          {token ? 'Start Planning' : 'Get Started Free'}
        </Link>
      </div>

      {/* Features */}
      <div className="grid md:grid-cols-3 gap-8">
        <FeatureCard
          icon={<Sparkles className="w-6 h-6 text-blue-600" />}
          title="AI-Generated Itineraries"
          description="GPT-4 powered planning with structured day-by-day itineraries, budget breakdowns, and local tips."
        />
        <FeatureCard
          icon={<Zap className="w-6 h-6 text-amber-600" />}
          title="Real-Time Data"
          description="Live weather forecasts, currency exchange rates, timezone info, and distance calculations."
        />
        <FeatureCard
          icon={<Shield className="w-6 h-6 text-green-600" />}
          title="Production-Grade"
          description="Resilient microservice architecture with Kafka, retry logic, and real-time SSE progress updates."
        />
      </div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  description,
}: {
  icon: React.ReactNode;
  title: string;
  description: string;
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 p-6 hover:shadow-md transition-shadow">
      <div className="mb-3">{icon}</div>
      <h3 className="font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-sm text-gray-500">{description}</p>
    </div>
  );
}
