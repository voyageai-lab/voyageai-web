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
  visibility?: 'PRIVATE' | 'LINK_SHARED' | 'PUBLIC';
  shareToken?: string | null;
  role?: 'OWNER' | 'EDITOR' | 'VIEWER';
  ownerDisplayName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ShareResponse {
  projectId: string;
  visibility: string;
  shareToken: string | null;
  shareUrl: string | null;
  shareTokenCreatedAt: string | null;
}

export interface SharedProjectResponse {
  projectId: string;
  title: string;
  description: string | null;
  ownerDisplayName: string;
  ownerAvatarUrl: string | null;
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

export interface TravelTip {
  category: 'booking' | 'closure' | 'dress_code' | 'safety' | 'logistics' | 'budget' | 'cultural' | string;
  message: string;
  priority?: 'high' | 'medium' | 'low';
  appliesTo?: string;
  advanceDays?: number;
}

export interface StructuredItinerary {
  metadata: ItineraryMetadata;
  days: DailyItinerary[];
  tips?: string[];
  travelTips?: TravelTip[];
  // AI-generated flexible fields (packing_suggestions, emergency_info, etc.)
  [key: string]: unknown;
}

export interface ItineraryMetadata {
  destination: string;
  startDate: string;
  endDate: string;
  totalDays: number;
  budget: string;
  interests: string[];
  // AI-generated extras (best_season, currency, language, etc.)
  [key: string]: unknown;
}

export interface DailyItinerary {
  dayNumber: number;
  date: string;
  theme: string;
  activities: Activity[];
  alternatives?: Activity[][];
  summary?: string;
  // AI-generated extras (weather_forecast, total_walking_km, etc.)
  [key: string]: unknown;
}

export interface DistanceInfo {
  km: number;
  transportMode?: string;
  transportDetail?: string;
  durationMinutes?: number;
  transitCost?: string;
}

export interface SourceLink {
  title: string;
  url: string;
  source: string; // 'official' | 'xiaohongshu' | 'foursquare' | 'google_maps' | 'web_search'
  snippet?: string;
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
  distanceFromPrevious?: DistanceInfo;
  highlights?: string[];
  rating?: number;
  bookingRequired?: boolean;
  bookingUrl?: string;
  reservationTip?: string;
  cuisineType?: string;
  websiteUrl?: string;
  sourceLinks?: SourceLink[];
  // AI-generated extras — any field the AI thinks is useful
  [key: string]: unknown;
}

export interface Location {
  name: string;
  latitude: number;
  longitude: number;
  address?: string;
  placeType?: string;
  [key: string]: unknown;
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
  | 'clarification_answer'
  | 'auth_required'
  | 'auth_success'
  | 'auth_expired';

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

// ==============================
// Community Types (Module 19)
// ==============================

export interface CommunityPost {
  id: number;
  userId: number;
  planId: string | null;
  projectId: string | null;
  title: string;
  description: string | null;
  coverImageUrl: string | null;
  likesCount: number;
  commentsCount: number;
  viewsCount: number;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  likedByMe: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Comment {
  id: number;
  postId: number;
  userId: number;
  parentCommentId: number | null;
  content: string;
  authorDisplayName: string;
  authorAvatarUrl: string | null;
  replies?: Comment[];
  createdAt: string;
  updatedAt: string;
}

// ==============================
// Collaboration Types (Module 20)
// ==============================

export type CollaboratorRole = 'OWNER' | 'EDITOR' | 'VIEWER';

export interface Collaborator {
  id: number;
  projectId: string;
  userId: number;
  role: CollaboratorRole;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  acceptedAt: string | null;
  createdAt: string;
}

export interface PresenceUser {
  userId: number;
  displayName: string;
  avatarUrl: string | null;
  lastSeen: string;
}

// ==============================
// Gmail Trip Detection Types
// ==============================

export interface DetectedBooking {
  emailId: string;
  subject: string;
  emailDate: string;
  type: 'hotel' | 'flight' | 'ticket' | 'other';
  dates: string[];
  confirmationNumber?: string;
  locationHints: string[];
}

export interface GmailScanResponse {
  bookings: DetectedBooking[];
  emailsScanned: number;
  message: string;
}
