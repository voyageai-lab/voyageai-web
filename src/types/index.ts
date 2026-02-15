// ==============================
// Auth Types
// ==============================

export interface LoginRequest {
  email: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  displayName?: string;
}

export interface AuthResponse {
  token: string;
  tokenType: string;
  user: User;
}

export interface User {
  id: number;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  authProvider: string;
}

// ==============================
// Project Types
// ==============================

export interface Project {
  projectId: string;
  title: string;
  description: string | null;
  status: 'ACTIVE' | 'ARCHIVED' | 'DELETED';
  createdAt: string;
  updatedAt: string;
}

export interface UpdateProjectRequest {
  title: string;
}

// ==============================
// Planning Types
// ==============================

export interface PlanningRequest {
  requirements: string;
  projectId?: string;
}

export interface PlanningSubmitResponse {
  taskId: string;
  projectId: string;
  message: string;
  statusUrl: string;
}

export type TaskStatus =
  | 'PENDING'
  | 'PROCESSING'
  | 'COMPLETED'
  | 'FAILED'
  | 'CANCELLED';

export interface TaskStatusResponse {
  taskId: string;
  taskType: string | null;
  status: TaskStatus;
  progressMessage: string | null;
  progressPercent: number | null;
  requirements: string | null;
  structuredItinerary: StructuredItinerary | null;
  result: string | null;
  errorMessage: string | null;
  createdAt: string;
  updatedAt: string;
  completedAt: string | null;
}

// ==============================
// SSE Event Types (TaskStatusUpdate from Java backend)
// ==============================

export interface SSETaskUpdate {
  taskId: string;
  status: TaskStatus;
  progressMessage: string | null;
  progressPercent: number | null;
  structuredItinerary: StructuredItinerary | null;
  result: string | null;
  errorMessage: string | null;
  timestamp: number;
}

// ==============================
// Itinerary Types (matches Java StructuredItinerary)
// ==============================

export interface StructuredItinerary {
  metadata: ItineraryMetadata;
  days: DailyItinerary[];
  tips?: string[];
}

export interface ItineraryMetadata {
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  budget: string;
  interests: string[];
}

export interface DailyItinerary {
  dayNumber: number;
  date: string;
  theme: string;
  activities: Activity[];
  summary?: string;
}

export interface Activity {
  activityId: string;
  time: string;
  title: string;
  description: string;
  location: Location;
  type?: string;
  estimatedCost?: string;
  tips?: string;
  notes?: string[];
  durationMinutes?: number;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  placeType?: string;
}

// ==============================
// Agent Event Types (Phase 1 SSE streaming)
// ==============================

export type AgentEventType =
  | 'thinking'
  | 'tool_start'
  | 'tool_result'
  | 'stage_change'
  | 'plan_outline'
  | 'cost_summary'
  | 'clarification_needed'
  | 'clarification_answer';

export interface AgentEvent {
  type: AgentEventType;
  timestamp: string;
  data: Record<string, unknown>;
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

// ==============================
// Chat Message Types (for frontend chat UI)
// ==============================

export type ChatMessageRole = 'user' | 'assistant' | 'system';

export interface ChatMessage {
  id: string;
  role: ChatMessageRole;
  content: string;
  timestamp: string;
  taskId?: string;
  itinerary?: StructuredItinerary;
  toolTrace?: ToolTrace[];
  agentEvents?: AgentEvent[];
  status?: TaskStatus;
  progress?: number;
  progressMessage?: string;
}

// ==============================
// Conversation History (from backend)
// ==============================

export interface ConversationMessage {
  messageId: string;
  projectId: string;
  role: string;
  messageType: string;
  content: string;
  structuredData?: string;
  timestamp: string;
}

export interface ConversationHistoryResponse {
  projectId: string;
  messages: ConversationMessage[];
  totalCount: number;
}
