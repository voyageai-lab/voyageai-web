// ==============================
// Auth Types
// ==============================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  username: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  username: string;
  email: string;
}

export interface User {
  username: string;
  email: string;
}

// ==============================
// Planning Types
// ==============================

export interface PlanningRequest {
  requirements: string;
  projectId: string;
}

export interface PlanningSubmitResponse {
  taskId: string;
  status: string;
  message: string;
}

export type TaskStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface PlanningTask {
  taskId: string;
  userId: string;
  projectId: string;
  status: TaskStatus;
  progress: number;
  progressMessage: string;
  result: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
}

// ==============================
// SSE Event Types
// ==============================

export interface SSEProgressEvent {
  taskId: string;
  status: TaskStatus;
  progress: number;
  message: string;
}

export interface SSECompletedEvent {
  taskId: string;
  status: 'COMPLETED';
  progress: 100;
  result: string;
}

export interface SSEFailedEvent {
  taskId: string;
  status: 'FAILED';
  errorMessage: string;
}

// ==============================
// Itinerary Types (matches Java StructuredItinerary)
// ==============================

export interface Itinerary {
  destination: string;
  startDate: string;
  endDate: string;
  totalBudget: number;
  currency: string;
  travelers: number;
  summary: string;
  days: ItineraryDay[];
}

export interface ItineraryDay {
  dayNumber: number;
  date: string;
  theme: string;
  activities: Activity[];
  dailyBudget: number;
}

export interface Activity {
  time: string;
  name: string;
  description: string;
  location: string;
  latitude: number;
  longitude: number;
  duration: string;
  cost: number;
  category: string;
  tips: string;
}

// ==============================
// Tool Trace Types
// ==============================

export interface ToolTrace {
  tool: string;
  arguments: Record<string, unknown>;
  latency_ms: number;
  success: boolean;
}
