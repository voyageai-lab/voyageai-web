# Module 16: ChatGPT-Style Frontend Redesign

## Overview

This module transforms the VoyageAI frontend from a simple form-based planning page into a ChatGPT-style hybrid application with three panels: a project sidebar, a real-time chat area with SSE streaming, and a collapsible itinerary display panel. It also adds Google OAuth login support and a project management REST API on the Java backend.

## Architecture

### Three-Panel Layout

```
+------------------+------------------------------+-------------------+
|    Sidebar       |        Chat Area             | Itinerary Panel   |
|  (280px fixed)   |      (flex grow)             |  (420px, toggle)  |
|                  |                              |                   |
| [+ New Chat]     |  User: Plan a 5-day trip...  | Day 1: ...        |
|                  |                              |   Activity 1      |
| > Tokyo Trip     |  AI: [spinner] Planning...   |   Activity 2      |
| > Paris Weekend  |       [=====50%====]         |                   |
|                  |                              | Day 2: ...        |
|                  |  AI: Here's your itinerary!  |   Activity 1      |
|                  |       [View Itinerary ->]    |                   |
|                  |                              | Tool Traces:      |
| User avatar      |  [Type message...] [Send]    |   geocode (120ms) |
| [Logout]         |                              |   weather (85ms)  |
+------------------+------------------------------+-------------------+
```

### Data Flow

```
User types message
    |
    v
ChatInput -> dispatch(addUserMessage) -> Redux chatSlice (adds user bubble)
    |
    v
dispatch(submitPlanning) -> POST /api/planning/generate
    |                        (auto-creates TravelProject)
    v
Redux adds assistant "processing" bubble
    |
    v
useSSE hook connects to /api/planning/tasks/{taskId}/stream
    |
    v
SSE events arrive: progress(30%), progress(50%), completed
    |                                                |
    v                                                v
Update assistant bubble                      Parse structuredItinerary
(spinner, progress bar)                      Populate ItineraryPanel
    |
    v
fetchProjects() refreshes sidebar
```

## Key Design Decisions

### 1. Why Three Panels Instead of Single Page?

The ChatGPT-style three-panel layout was chosen because:

- **Context Switching**: Users frequently switch between conversations. A sidebar eliminates page navigation.
- **Side-by-Side View**: The itinerary panel shows structured output alongside the chat, avoiding scroll-to-find behavior.
- **Progressive Disclosure**: The itinerary panel only appears when there's content to show, keeping the UI clean.

### 2. Why Redux Toolkit Over React Query?

Redux Toolkit was chosen over React Query for this application because:

- **SSE State Management**: Real-time SSE events need to update multiple parts of the UI simultaneously (chat messages, progress bars, itinerary panel). Redux provides a single source of truth.
- **Cross-Component Communication**: The sidebar, chat area, and itinerary panel all need to react to the same state changes. Redux makes this natural with selectors.
- **Optimistic Updates**: When a user sends a message, we immediately add it to the chat (optimistic) before the API responds. Redux's synchronous dispatching makes this straightforward.

React Query would be better suited for simple CRUD data fetching (e.g., project list), but the SSE streaming use case favors Redux.

### 3. Chat Messages as Redux State, Not Component State

Chat messages live in Redux (`chatSlice.messages`) rather than component-local state because:

- **Persistence Across Navigation**: If a user clicks away and comes back, messages are still there.
- **SSE Integration**: The `useSSE` hook dispatches directly to the store, updating the last assistant message in-place as progress events arrive.
- **Testing**: Redux state is easily testable without rendering components.

## Backend Changes

### StructuredItinerary Deserialization Fix

**Problem**: The Python AI worker sends itinerary JSON with snake_case field names (`start_date`, `day_number`, `activity_id`, `estimated_cost`, `place_type`). The Java backend stored this as a raw string in `PlanningTask.result` but never deserialized it into the `StructuredItinerary` Java object. The `structuredItinerary` field was always `null` in SSE events.

**Solution**: Two-part fix:

1. **`@JsonAlias` annotations** on `StructuredItinerary` nested classes. We use `@JsonAlias("snake_case")` (not `@JsonProperty`) so that:
   - **Deserialization** accepts both `snake_case` (from Python) and `camelCase` (from existing Java tests)
   - **Serialization** outputs `camelCase` (Java field names) for the frontend

   ```java
   // In StructuredItinerary.ItineraryMetadata:
   @JsonAlias("start_date")
   private String startDate;  // Serializes as "startDate", deserializes from both
   ```

2. **`KafkaConsumerService.handleCompletedResult()`** now deserializes `itineraryJson` string into a `StructuredItinerary` object before calling `markCompleted()`:

   ```java
   StructuredItinerary structuredItinerary = objectMapper.readValue(
       event.getItineraryJson(), StructuredItinerary.class);
   taskService.markCompleted(taskId, structuredItinerary, event.getItineraryJson());
   ```

### Project Management REST API

**New Endpoints** in `ProjectController`:

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/projects` | List user's active projects |
| GET | `/api/projects/{projectId}` | Get single project |
| PUT | `/api/projects/{projectId}` | Rename project |
| DELETE | `/api/projects/{projectId}` | Archive (soft-delete) project |

These endpoints expose the existing `TravelProjectService` methods (which already existed but had no REST controller).

## Frontend Architecture

### Store Design (Redux Toolkit)

Three slices:

1. **`authSlice`**: User authentication state, JWT token in cookies, login/register/OAuth thunks
2. **`chatSlice`**: Chat messages, current task state, SSE connection, itinerary result
3. **`projectsSlice`**: Project list, active project selection, CRUD operations

```typescript
// Root state shape:
{
  auth: { user, token, loading, error },
  chat: { messages[], currentTaskId, status, progress, itinerary, toolTrace[], ... },
  projects: { projects[], activeProjectId, loading, error }
}
```

### SSE Hook (`useSSE`)

The `useSSE` hook is the bridge between server-side events and the Redux store:

1. Opens `EventSource` to `/api/planning/tasks/{taskId}/stream` with JWT as query param
2. Listens for named events: `progress`, `status`, `completed`, `failed`
3. A unified `handleStatusData` function processes all events, dispatching:
   - `setProgress` for in-progress updates (updates the assistant "typing" bubble)
   - `setCompleted` for successful completion (extracts `structuredItinerary` from the event)
   - `setFailed` for errors

**Key improvement**: The new SSE hook reads `structuredItinerary` directly from the SSE event data (now populated by the backend fix), rather than trying to double-parse a JSON string from `result`.

### Google OAuth2 Flow

```
1. User clicks "Continue with Google" button
2. Browser navigates to /oauth2/authorization/google (proxied to Java backend)
3. Spring Security redirects to Google consent screen
4. User authorizes → Google redirects to /login/oauth2/code/google
5. OAuth2LoginSuccessHandler creates/merges user, generates JWT
6. Redirects to frontend: /auth/callback?token=JWT
7. AuthCallbackPage extracts token, stores in cookie, fetches /api/auth/me
8. Redirects to / (main app)
```

The Vite dev proxy and Nginx production config both forward `/oauth2/**` and `/login/oauth2/**` to the Java backend.

### Component Design

- **`Sidebar`**: Fetches projects on mount, renders list with delete buttons, handles new chat creation
- **`ChatArea`**: Contains message list + `ChatInput`. Dispatches `addUserMessage` + `submitPlanning` on send.
- **`ChatInput`**: Auto-resizing textarea, Enter to send, Shift+Enter for newlines
- **`MessageBubble`**: Renders user (blue, right-aligned) or assistant (white, left-aligned) messages. Processing state shows spinner + progress bar. Completed state shows "View Itinerary" button.
- **`ItineraryPanel`**: Two tabs (Itinerary / Tools). Renders `StructuredItinerary` with day cards, activity rows, location objects (name + address), and expandable tool traces.
- **`AppLayout`**: Composes Sidebar + ChatArea + ItineraryPanel with conditional panel visibility.

### Fixing React Error #31

**Root cause**: The old `ItineraryDisplay.tsx` rendered `{activity.location}` directly in JSX. But `location` is a `Location` object (`{ name, latitude, longitude, address, placeType }`), not a string. React cannot render objects as children.

**Fix**: The new `ItineraryPanel` renders `activity.location.name` and optionally `activity.location.address`:

```tsx
{activity.location && (
  <p className="text-xs text-gray-400">
    {activity.location.name}
    {activity.location.address && ` - ${activity.location.address}`}
  </p>
)}
```

## Security Considerations

### JWT Token Handling

- Stored in `js-cookie` with 1-day expiration (not `localStorage`, reducing XSS surface)
- Sent as `Authorization: Bearer` header for REST API calls
- Sent as `?token=` query parameter for SSE connections (EventSource doesn't support custom headers)
- `fetchCurrentUser` thunk validates token on app mount; if invalid, clears auth state

### OAuth2 State Parameter

Spring Security's OAuth2 flow uses the `state` parameter to prevent CSRF attacks. This requires server-side sessions (`SessionCreationPolicy.IF_REQUIRED`), which is why the backend isn't fully stateless.

### API Error Handling

The `ApiClient` throws `ApiError` with status code and response body. The store handles errors in `rejected` thunk cases, displaying them to the user without exposing stack traces.

## Testing Strategy

### Store Tests (26 tests)

- `authSlice`: Initial state, setUser, setToken, logout, clearError
- `chatSlice`: Initial state, addUserMessage, setProgress, setCompleted (with structured itinerary and tool traces), setFailed, setSseConnected, resetChat, clearChatForProject
- `projectsSlice`: Initial state, setActiveProject, addProject, clearProjects

### Component Tests (8 tests)

- `ChatInput`: Renders correctly, calls onSend on submit, respects disabled prop
- `MessageBubble`: Renders user/assistant messages, shows processing state with spinner, shows "View Itinerary" button, shows failed state

### Integration Points

For full E2E testing with Docker Compose:
1. Register/login a user
2. Submit a planning request (triggers project auto-creation)
3. Verify SSE events stream progress updates
4. Verify itinerary appears in the panel
5. Verify project appears in the sidebar

## Docker Configuration

### Nginx Routes (Production)

The Nginx config in Docker serves:
- `/` - SPA with `try_files` fallback to `index.html`
- `/api/*` - Proxied to `java-backend:8081` with SSE buffering disabled
- `/oauth2/*` - Proxied to `java-backend:8081` (OAuth2 authorization)
- `/login/oauth2/*` - Proxied to `java-backend:8081` (OAuth2 callback)
- `/actuator/*` - Proxied to `java-backend:8081` (health checks)

### Vite Proxy (Development)

Same routes proxied via `vite.config.ts` `server.proxy` for development without Docker.
