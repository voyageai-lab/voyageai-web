# Module 14: React Frontend - Building a Real-Time ChatGPT-Style Travel Planner

## Table of Contents

1. [Overview](#1-overview)
2. [Theoretical Foundations](#2-theoretical-foundations)
3. [Architecture Design](#3-architecture-design)
4. [Vite + React + TypeScript Setup](#4-vite--react--typescript-setup)
5. [Redux Toolkit State Management](#5-redux-toolkit-state-management)
6. [Server-Sent Events (SSE) Integration](#6-server-sent-events-sse-integration)
7. [Three-Panel Layout Design](#7-three-panel-layout-design)
8. [Chat System Implementation](#8-chat-system-implementation)
9. [Project Management](#9-project-management)
10. [Itinerary Display and Tool Trace](#10-itinerary-display-and-tool-trace)
11. [Authentication and Google OAuth2](#11-authentication-and-google-oauth2)
12. [Cross-Language Serialization: Java ↔ TypeScript](#12-cross-language-serialization-java--typescript)
13. [API Client and Proxy Architecture](#13-api-client-and-proxy-architecture)
14. [Security Considerations](#14-security-considerations)
15. [Testing Strategies](#15-testing-strategies)
16. [Production Considerations](#16-production-considerations)
17. [Hands-On Exercises](#17-hands-on-exercises)

---

## 1. Overview

### What This Module Covers

This module builds a production-quality ChatGPT-style React frontend for the VoyageAI travel planner. The UI features a three-panel layout with a project sidebar, real-time chat with SSE streaming, and a collapsible itinerary display panel. It connects to the Java backend via REST APIs, SSE for real-time progress, and supports both email/password and Google OAuth2 authentication.

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend Architecture                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   React 19 (Vite)                     │       │
│  │                                                        │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │       │
│  │  │ Sidebar  │  │  Chat    │  │  Itinerary Panel  │    │       │
│  │  │ Projects │  │  Area    │  │  + Tool Trace     │    │       │
│  │  └────┬─────┘  └────┬─────┘  └────────┬─────────┘    │       │
│  │       │              │                  │               │       │
│  │       ▼              ▼                  ▼               │       │
│  │  ┌──────────────────────────────────────────────────┐  │       │
│  │  │           Redux Toolkit Store                     │  │       │
│  │  │  authSlice │ chatSlice │ projectsSlice            │  │       │
│  │  └──────────────────┬───────────────────────────────┘  │       │
│  │                     │                                    │       │
│  │       ┌─────────────┼─────────────┐                     │       │
│  │       ▼             ▼             ▼                     │       │
│  │  ┌────────┐  ┌──────────┐  ┌──────────┐               │       │
│  │  │REST API│  │   SSE    │  │ Cookies  │               │       │
│  │  │ Client │  │  Hook    │  │  (JWT)   │               │       │
│  │  └────┬───┘  └────┬─────┘  └──────────┘               │       │
│  └───────┼────────────┼──────────────────────────────────┘       │
│          │            │                                           │
│          ▼            ▼                                           │
│  ┌──────────────────────────────┐                                │
│  │   Vite Proxy (dev) / Nginx  │  /api/*   → java-backend:8081  │
│  │                (prod)        │  /oauth2  → java-backend:8081  │
│  └──────────────┬───────────────┘                                │
│                 │                                                 │
│                 ▼                                                 │
│  ┌──────────────────────────────┐                                │
│  │     Java Backend (8081)      │                                │
│  │  POST /api/planning/generate │                                │
│  │  GET  /api/planning/tasks/   │                                │
│  │       {id}/stream (SSE)      │                                │
│  │  GET  /api/projects          │                                │
│  │  GET  /oauth2/authorization/ │                                │
│  └──────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

### Module Learning Objectives

By the end of this module, you will:

- Build a ChatGPT-style three-panel layout with React and Tailwind CSS
- Implement Redux Toolkit with three domain slices (auth, chat, projects)
- Build a real-time SSE hook for streaming progress updates during AI generation
- Create a project management system with sidebar navigation and conversation history
- Implement dual authentication: email/password login and Google OAuth2 callback
- Design TypeScript types that mirror Java DTOs for type-safe cross-language communication
- Understand why `@JsonAlias` (not `@JsonProperty`) is needed for snake_case ↔ camelCase serialization
- Write comprehensive tests with Vitest and React Testing Library
- Configure Vite proxy (dev) and Nginx (prod) for seamless API and OAuth2 forwarding

---

## 2. Theoretical Foundations

### 2.1 Why Vite Over Create React App (CRA)?

```
┌─────────────────────────────────────────────────────────────────┐
│              Build Tool Comparison                                │
│                                                                  │
│              CRA (Webpack)     Vite (ESBuild + Rollup)           │
│  ──────────  ──────────────    ────────────────────               │
│  Dev start:  ~8-15 seconds    ~300ms                             │
│  HMR:        ~1-3 seconds     ~50ms (instant)                    │
│  Build:      ~30-60 seconds   ~3-10 seconds                      │
│  Config:     Ejectable        Native, simple                      │
│  ESM:        Bundled           Native browser ESM                 │
│                                                                  │
│  Why? Vite uses native ES modules in development.                │
│  The browser resolves imports directly — no bundling needed.     │
│  ESBuild (written in Go) handles TypeScript 10-100x faster      │
│  than tsc or Babel.                                               │
└─────────────────────────────────────────────────────────────────┘
```

**How Vite works internally:**

In development, Vite starts a native ESM dev server. When the browser requests a module (e.g., `import { useState } from 'react'`), Vite intercepts the request, transforms the file on-the-fly using ESBuild, and serves it. There is no bundling step — each file is served individually, and the browser's `<script type="module">` handles the dependency graph.

In production, Vite switches to Rollup for bundling, which produces optimized, tree-shaken output with code splitting and asset hashing.

### 2.2 Redux Toolkit vs Other State Solutions

```
┌─────────────────────────────────────────────────────────────────┐
│              State Management Options                             │
│                                                                  │
│  Solution          Best For                   Our Choice         │
│  ────────          ────────                   ──────────         │
│  React Context     Small apps, theme/locale   No (doesn't       │
│                                               scale)             │
│  Zustand           Medium apps, simple API    No (less           │
│                                               tooling)           │
│  Redux Toolkit ✓   Complex async flows,       YES                │
│                    DevTools, middleware                            │
│  React Query       Server state caching,      No (not suited     │
│  (TanStack)        CRUD data fetching         for SSE streams)   │
│  Jotai/Recoil      Atomic state               No (different      │
│                                               paradigm)           │
│                                                                  │
│  Why RTK? Our app has:                                            │
│  - Three domain slices with complex async thunks                 │
│  - SSE events dispatching actions from OUTSIDE React components  │
│  - Cross-component state (auth token used by API client,         │
│    chat state shared by ChatArea + ItineraryPanel + Sidebar)     │
│  - Optimistic updates (user message shown before API responds)   │
│  - DevTools for debugging state transitions during SSE streams   │
│                                                                  │
│  React Query would work for project list fetching, but the SSE   │
│  streaming use case (multiple events → multiple state updates    │
│  in a single stream) is Redux's sweet spot.                      │
└─────────────────────────────────────────────────────────────────┘
```

**Deep dive: Why SSE makes Redux the right choice**

Server-Sent Events deliver a continuous stream of events to the client. Each event must update multiple parts of the UI simultaneously:

1. The assistant message bubble (progress text + progress bar)
2. The global chat status (PROCESSING → COMPLETED)
3. The itinerary panel (populated on completion)
4. The toolbar/header (loading indicator)

With Redux, a single `dispatch(setCompleted({itinerary, toolTrace}))` triggers all four updates via selectors. With React Context, you'd need to call multiple setters, risking out-of-order renders. With React Query, there's no built-in mechanism for SSE event streams that modify local state.

### 2.3 Server-Sent Events vs WebSocket

```
┌─────────────────────────────────────────────────────────────────┐
│              SSE vs WebSocket                                     │
│                                                                  │
│  Feature           SSE                  WebSocket                │
│  ───────           ───                  ─────────                │
│  Direction:        Server → Client      Bidirectional            │
│  Protocol:         HTTP/1.1             ws:// (separate)         │
│  Reconnect:        Built-in auto        Manual                   │
│  Browser API:      EventSource          WebSocket                │
│  Proxy-friendly:   Yes (plain HTTP)     Needs upgrade            │
│  Data format:      Text (JSON)          Text or Binary           │
│  Auth headers:     No (query param)     Yes (upgrade handshake)  │
│                                                                  │
│  Our use case: Server pushes progress updates to client.         │
│  Client never needs to send data to the stream.                  │
│  SSE is the perfect fit — simpler, auto-reconnect, HTTP-native. │
│                                                                  │
│  Limitation: EventSource API doesn't support custom headers.     │
│  We pass JWT as ?token= query parameter for authentication.      │
│                                                                  │
│  SSE Event Format:                                                │
│  event: progress                                                  │
│  data: {"status":"PROCESSING","progress":50,"message":"..."}     │
│                                                                  │
│  event: completed                                                 │
│  data: {"status":"COMPLETED","structuredItinerary":{...}}        │
└─────────────────────────────────────────────────────────────────┘
```

### 2.4 Why Three-Panel Layout?

```
┌─────────────────────────────────────────────────────────────────┐
│              Layout Pattern Analysis                              │
│                                                                  │
│  Pattern 1: Single Page (form → result)                          │
│  ├── Simple, linear flow                                         │
│  ├── Must navigate between history and current task              │
│  └── Result replaces form (can't see both at once)               │
│                                                                  │
│  Pattern 2: Two-Panel (sidebar + main)                           │
│  ├── Sidebar for navigation, main for content                    │
│  ├── Itinerary would be in the chat, hard to reference           │
│  └── No persistent itinerary view                                │
│                                                                  │
│  Pattern 3: Three-Panel (sidebar + chat + detail) ✓              │
│  ├── Sidebar: project/conversation list (context switching)      │
│  ├── Chat: message history + input (interaction)                 │
│  ├── Detail: itinerary/tools (rich output, always visible)       │
│  ├── Used by: ChatGPT, Slack, Notion, Linear                    │
│  └── Best for: AI chat apps where output is structured           │
│                                                                  │
│  Key insight: Travel itineraries are structured data (days,      │
│  activities, locations, costs), not just text. Displaying them   │
│  in a chat bubble is wasteful. A dedicated panel allows proper   │
│  formatting with day cards, activity rows, and location pins.    │
└─────────────────────────────────────────────────────────────────┘
```

### 2.5 Optimistic Updates

```
┌─────────────────────────────────────────────────────────────────┐
│              Optimistic UI Pattern                                │
│                                                                  │
│  Without optimistic:                                              │
│  User clicks Send → spinner → wait 200ms → message appears       │
│  (feels slow, unresponsive)                                      │
│                                                                  │
│  With optimistic:                                                 │
│  User clicks Send → message IMMEDIATELY appears → API call       │
│  starts in background → success: keep message / fail: show error │
│  (feels instant, responsive)                                     │
│                                                                  │
│  Our implementation:                                              │
│  1. dispatch(addUserMessage(text)) → message appears instantly   │
│  2. dispatch(submitPlanning({requirements})) → POST to API       │
│  3. If API succeeds: assistant "typing" bubble appears           │
│  4. If API fails: error message appears                          │
│                                                                  │
│  This is Redux's strength: synchronous dispatching of            │
│  addUserMessage runs before the async submitPlanning thunk.      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Architecture Design

### 3.1 Component Tree

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  App (Provider + BrowserRouter)                                  │
│  ├── AppRoutes                                                   │
│  │   ├── /login       → LoginForm                                │
│  │   ├── /register    → RegisterForm                             │
│  │   ├── /auth/callback → AuthCallbackPage (OAuth2 redirect)    │
│  │   └── /*           → AuthGuard                                │
│  │       └── AppLayout                                           │
│  │           ├── Sidebar (project list + user info + logout)     │
│  │           ├── ChatArea (messages + input)                     │
│  │           │   ├── MessageBubble[] (user/assistant bubbles)    │
│  │           │   └── ChatInput (auto-resize textarea)            │
│  │           └── ItineraryPanel (collapsible, two tabs)          │
│  │               ├── ItineraryContent (day cards + activities)   │
│  │               └── ToolTraceContent (expandable tool details)  │
│  │                                                               │
│  Store                                                           │
│  ├── authSlice (user, token, login/register/OAuth thunks)        │
│  ├── chatSlice (messages, taskId, projectId, progress, SSE)      │
│  └── projectsSlice (projects[], activeProjectId, CRUD thunks)   │
│                                                                  │
│  Hooks                                                           │
│  └── useSSE(taskId) → connects EventSource, dispatches actions   │
│                                                                  │
│  API Client                                                      │
│  └── apiClient.get/post/put/delete/createSSE → fetch + JWT      │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow: User Submits a Planning Request

```
┌─────────────────────────────────────────────────────────────────┐
│              Planning Data Flow (Full Cycle)                      │
│                                                                  │
│  1. User types "Plan a 5-day trip to Tokyo" in ChatInput         │
│  2. ChatArea dispatches addUserMessage(text) → user bubble       │
│  3. ChatArea dispatches submitPlanning({requirements, projectId})│
│  4. chatSlice.pending: sets loading=true, status=PENDING         │
│  5. API: POST /api/planning/generate                             │
│     → Backend creates task + project (or uses existing)          │
│     → Returns { taskId, projectId }                              │
│  6. chatSlice.fulfilled: stores taskId + projectId               │
│     → Adds assistant "typing" bubble with spinner                │
│  7. useSSE(taskId) opens EventSource to /api/planning/tasks/     │
│     {taskId}/stream?token=JWT                                    │
│  8. SSE events arrive:                                           │
│     - progress → dispatch(setProgress) → update spinner/bar     │
│     - completed → dispatch(setCompleted) → parse itinerary      │
│       → assistant bubble shows "View Itinerary"                  │
│       → ItineraryPanel auto-shows with structured data           │
│     - failed → dispatch(setFailed) → error message              │
│  9. EventSource closes on terminal event                         │
│ 10. fetchProjects() refreshes sidebar with new/updated project   │
│                                                                  │
│  ┌────────┐ sync  ┌───────┐ async ┌─────┐  SSE   ┌───────┐    │
│  │ChatArea│──────▶│chatSl.│──────▶│ API │───────▶│useSSE │    │
│  └────────┘       └───────┘       └─────┘        └───┬───┘    │
│       ▲                                               │         │
│       └──── re-renders via useAppSelector ◀───────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 3.3 Data Flow: User Selects an Existing Project

```
┌─────────────────────────────────────────────────────────────────┐
│              Project Switch Data Flow                             │
│                                                                  │
│  1. User clicks project in Sidebar                               │
│  2. Sidebar dispatches setActiveProject(projectId)               │
│  3. Sidebar dispatches setCurrentProjectId(projectId) → chat    │
│  4. Sidebar dispatches loadConversationHistory(projectId)        │
│     → GET /api/planning/projects/{projectId}/history             │
│  5. chatSlice.fulfilled: replaces messages[] with history        │
│  6. User sends new message → submitPlanning includes projectId  │
│     → Backend appends to EXISTING project (no new project)       │
│                                                                  │
│  Key: currentProjectId in chatSlice is passed to the backend    │
│  so follow-up messages go to the SAME project conversation.      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Vite + React + TypeScript Setup

### 4.1 Project Scaffolding

```bash
npm create vite@latest voyageai-web -- --template react-ts
cd voyageai-web
npm install
```

### 4.2 Dependencies

```json
{
  "dependencies": {
    "@reduxjs/toolkit": "^2.11.2",
    "js-cookie": "^3.0.5",
    "react": "^19.2.0",
    "react-dom": "^19.2.0",
    "react-redux": "^9.2.0",
    "react-router-dom": "^7.13.0"
  },
  "devDependencies": {
    "@tailwindcss/vite": "^4.1.18",
    "@testing-library/react": "^16.3.2",
    "@testing-library/user-event": "^14.6.1",
    "happy-dom": "^20.6.1",
    "tailwindcss": "^4.1.18",
    "vitest": "^4.0.18"
  }
}
```

| Package | Purpose |
|---|---|
| `@reduxjs/toolkit` | State management with slices, thunks, DevTools |
| `react-redux` | React bindings for Redux store |
| `react-router-dom` | Client-side routing with auth guards |
| `js-cookie` | JWT token storage in cookies (not localStorage) |
| `tailwindcss` + `@tailwindcss/vite` | Utility-first CSS via Vite plugin |
| `vitest` + `happy-dom` | Fast testing with browser-like DOM |
| `@testing-library/react` | Component testing with user-centric queries |

### 4.3 Tailwind CSS v4 Integration

Tailwind v4 uses the Vite plugin directly (no `tailwind.config.js` needed):

```typescript
// vite.config.ts
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
})
```

```css
/* src/index.css */
@import "tailwindcss";
```

### 4.4 Path Aliases

Path aliases eliminate relative import hell (`../../../components/...`):

```json
// tsconfig.app.json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "@/*": ["./src/*"] }
  }
}
```

```typescript
// vite.config.ts
resolve: {
  alias: {
    '@': path.resolve(__dirname, './src'),
  },
}
```

Now imports become: `import { Sidebar } from '@/components/layout/Sidebar'`

### 4.5 Dev Server Proxy

The Vite dev server proxies API and OAuth2 requests to the Java backend:

```typescript
// vite.config.ts
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8081',
      changeOrigin: true,
    },
    '/oauth2': {
      target: 'http://localhost:8081',
      changeOrigin: true,
    },
    '/login/oauth2': {
      target: 'http://localhost:8081',
      changeOrigin: true,
    },
  },
}
```

This eliminates CORS issues in development. The browser sees all requests going to `localhost:5173`, and Vite forwards `/api/*`, `/oauth2/*`, and `/login/oauth2/*` to `localhost:8081`.

**Why three proxy rules?**
- `/api` — REST API calls and SSE streams
- `/oauth2` — Initiates Google OAuth2 flow (`/oauth2/authorization/google`)
- `/login/oauth2` — Google redirects back to this path after user consent

---

## 5. Redux Toolkit State Management

### 5.1 Store Configuration

```typescript
// src/store/store.ts
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import chatReducer from './chatSlice';
import projectsReducer from './projectsSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    chat: chatReducer,
    projects: projectsReducer,
  },
});

export type RootState = ReturnType<typeof store.getState>;
export type AppDispatch = typeof store.dispatch;
```

`configureStore` automatically includes:
- Redux DevTools integration
- `redux-thunk` middleware
- Immutability checks (development only)
- Serializability checks (development only)

### 5.2 Typed Hooks

```typescript
// src/store/hooks.ts
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

These typed hooks prevent type casting everywhere and provide autocomplete for state access:

```typescript
// Without typed hooks (verbose):
const dispatch = useDispatch<AppDispatch>();
const user = useSelector((state: RootState) => state.auth.user);

// With typed hooks (clean):
const dispatch = useAppDispatch();
const user = useAppSelector((s) => s.auth.user);
```

### 5.3 Root State Shape

```typescript
{
  auth: {
    user: User | null,           // Current authenticated user
    token: string | null,        // JWT token (also in cookie)
    loading: boolean,
    error: string | null
  },
  chat: {
    messages: ChatMessage[],     // Full conversation for current project
    currentTaskId: string | null,// Active SSE task being tracked
    currentProjectId: string | null, // Project these messages belong to
    status: TaskStatus | null,   // PENDING | PROCESSING | COMPLETED | FAILED
    progress: number,            // 0-100
    progressMessage: string,     // "Researching destinations..."
    itinerary: StructuredItinerary | null, // Latest generated itinerary
    toolTrace: ToolTrace[],      // AI tools used during generation
    error: string | null,
    loading: boolean,
    sseConnected: boolean        // Is EventSource active?
  },
  projects: {
    projects: Project[],         // All user's projects (sidebar)
    activeProjectId: string | null,
    loading: boolean,
    error: string | null
  }
}
```

### 5.4 authSlice: Authentication State

The auth slice manages JWT tokens, user info, and three authentication flows:

```typescript
// Thunks:
login(credentials)      → POST /api/auth/login → {token, user}
register(data)          → POST /api/auth/register → {token, user}
fetchCurrentUser()      → GET /api/auth/me → User

// Reducers:
setToken(token)         → Store token in Redux + js-cookie
setUser(user)           → Set user object
logout()                → Clear Redux + cookie
clearError()            → Clear error message
```

**Key pattern**: On `login.fulfilled` and `register.fulfilled`, the slice stores the JWT token in both Redux state AND `js-cookie`:

```typescript
.addCase(login.fulfilled, (state, action) => {
  state.token = action.payload.token;
  state.user = action.payload.user;
  Cookies.set('token', action.payload.token, { expires: 1 }); // 1 day
})
```

**Why dual storage?** Redux state is lost on page refresh. The cookie persists across refreshes, so `initialState` reads from cookie:

```typescript
const initialState: AuthState = {
  user: null,
  token: Cookies.get('token') || null,  // Restore from cookie
  loading: false,
  error: null,
};
```

On mount, if `token` exists but `user` is null, the App dispatches `fetchCurrentUser()` to validate the token and retrieve user info.

### 5.5 chatSlice: Chat and Task State

The chat slice is the most complex, managing the full lifecycle of a planning conversation:

```typescript
// Thunks:
submitPlanning({requirements, projectId?})  → POST /api/planning/generate
loadConversationHistory(projectId)           → GET /api/planning/projects/{id}/history

// Reducers (dispatched by useSSE hook):
addUserMessage(text)         → Append user bubble (optimistic)
setProgress({status, progress, message}) → Update assistant bubble
setCompleted({itinerary, toolTrace})     → Finalize assistant bubble
setFailed(errorMessage)      → Show error in assistant bubble
setSseConnected(boolean)     → Track EventSource connection
setCurrentProjectId(id)      → Set active project for follow-ups
resetChat()                  → Clear all state (new chat)
clearChatForProject()        → Clear when switching projects
```

**State machine for a planning task:**

```
                addUserMessage()
IDLE ──────────────────────────► USER_MSG_SHOWN
                                      │
                submitPlanning()      │
                    pending           ▼
              ┌──────────────── PENDING
              │                    │
              │   fulfilled        │
              │                    ▼
              │              PROCESSING ◄── setProgress()
              │                    │            (loops)
              │                    │
              │    setCompleted()  │  setFailed()
              │         │         │      │
              │         ▼         │      ▼
              │     COMPLETED     │   FAILED
              │                   │
              └── rejected ───────┘
```

### 5.6 projectsSlice: Project Management

```typescript
// Thunks:
fetchProjects()                    → GET /api/projects
deleteProject(projectId)           → DELETE /api/projects/{id}
renameProject({projectId, title})  → PUT /api/projects/{id}

// Reducers:
setActiveProject(id | null)        → Highlight in sidebar
addProject(project)                → Add to front of list
clearProjects()                    → Clear on logout
```

**Optimistic delete pattern:**

```typescript
.addCase(deleteProject.fulfilled, (state, action) => {
  // Remove from list immediately (API already confirmed)
  state.projects = state.projects.filter(p => p.projectId !== action.payload);
  // If we deleted the active project, deselect
  if (state.activeProjectId === action.payload) {
    state.activeProjectId = null;
  }
})
```

### 5.7 createAsyncThunk Pattern

All API calls use `createAsyncThunk` which auto-generates pending/fulfilled/rejected actions:

```typescript
export const submitPlanning = createAsyncThunk<
  PlanningSubmitResponse,  // Return type
  PlanningRequest          // Argument type
>('chat/submit', async (request) => {
  return apiClient.post<PlanningSubmitResponse>('/planning/generate', request);
});
```

Redux Toolkit automatically dispatches:
- `chat/submit/pending` → set loading state
- `chat/submit/fulfilled` → store taskId + projectId
- `chat/submit/rejected` → set error

---

## 6. Server-Sent Events (SSE) Integration

### 6.1 The useSSE Hook

The `useSSE` hook is the bridge between the server's event stream and the Redux store:

```
┌─────────────────────────────────────────────────────────────────┐
│                  useSSE Hook Lifecycle                            │
│                                                                  │
│  taskId changes (non-null)                                       │
│  │                                                               │
│  ├── Close any existing EventSource                              │
│  ├── Create EventSource(/api/planning/tasks/{id}/stream?token=) │
│  ├── dispatch(setSseConnected(true))                             │
│  │                                                               │
│  ├── Listen for "progress" events                                │
│  │   └── dispatch(setProgress({status, progress, message}))      │
│  │                                                               │
│  ├── Listen for "status" events (initial state)                  │
│  │   └── Same handler as progress                                │
│  │                                                               │
│  ├── Listen for "completed" events                               │
│  │   ├── Extract structuredItinerary directly from event data    │
│  │   ├── Extract toolTrace array                                 │
│  │   ├── dispatch(setCompleted({itinerary, toolTrace}))          │
│  │   └── Close EventSource                                       │
│  │                                                               │
│  ├── Listen for "failed" events                                  │
│  │   ├── dispatch(setFailed(errorMessage))                       │
│  │   └── Close EventSource                                       │
│  │                                                               │
│  └── On unmount or taskId change                                 │
│      ├── Close EventSource                                       │
│      └── dispatch(setSseConnected(false))                        │
└─────────────────────────────────────────────────────────────────┘
```

### 6.2 EventSource API Deep Dive

The browser's `EventSource` API handles SSE connections:

```typescript
// Create connection with JWT as query param (EventSource doesn't support headers)
const es = new EventSource('/api/planning/tasks/task-123/stream?token=JWT');

// Named events (the Java backend sends event: progress, status, completed, failed)
es.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);
  console.log(data.progress);  // 50
});

// Error handling — EventSource auto-reconnects by default
es.onerror = (event) => {
  // We close manually on terminal states to prevent infinite reconnect
  es.close();
};
```

### 6.3 Handling the Completed Event

The `handleStatusData` function is the unified handler for all SSE event types:

```typescript
const handleStatusData = (data: Record<string, unknown>) => {
  const status = data.status as TaskStatus;

  if (status === 'COMPLETED') {
    // structuredItinerary comes directly as an object from the Java backend
    // (no need to JSON.parse — the backend serializes it as camelCase)
    let itinerary = data.structuredItinerary as StructuredItinerary | null;

    // Fallback: try parsing from raw result string
    if (!itinerary && data.result) {
      try { itinerary = JSON.parse(data.result as string); } catch {}
    }

    dispatch(setCompleted({ itinerary, toolTrace: data.toolTrace as ToolTrace[] }));
    es.close();
  } else if (status === 'FAILED') {
    dispatch(setFailed(data.errorMessage as string));
    es.close();
  } else {
    dispatch(setProgress({ status, progress: data.progressPercent, message: data.progressMessage }));
  }
};
```

**Key insight**: The `structuredItinerary` field arrives as a properly-typed JSON object (not a string) because the Java backend serializes the `StructuredItinerary` Java object into the SSE event. This was a bug fix — previously, the backend sent `null` for `structuredItinerary` and only had a raw JSON string in `result`.

### 6.4 SSE Event Types from Java Backend

The Java `TaskStreamController` sends these named event types:

| Event Name | When | Data Fields |
|---|---|---|
| `status` | Initial connection | `{taskId, status, progressPercent, progressMessage}` |
| `progress` | During processing | `{status, progressPercent, progressMessage}` |
| `completed` | Task finished | `{status, structuredItinerary, toolTrace, result}` |
| `failed` | Task errored | `{status, errorMessage}` |

---

## 7. Three-Panel Layout Design

### 7.1 Layout Structure

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

### 7.2 AppLayout Component

```typescript
// src/components/layout/AppLayout.tsx
export function AppLayout() {
  const [showPanel, setShowPanel] = useState(false);
  const { itinerary } = useAppSelector((s) => s.chat);

  // Auto-show panel when itinerary arrives
  const panelVisible = showPanel && itinerary;

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <ChatArea onViewItinerary={() => setShowPanel(true)} />
      </div>
      {panelVisible && (
        <ItineraryPanel onClose={() => setShowPanel(false)} />
      )}
    </div>
  );
}
```

**CSS strategy**: The layout uses `flex h-screen overflow-hidden` to fill the viewport. The sidebar has a fixed width (`w-72`), the chat area uses `flex-1` to fill remaining space, and the itinerary panel has a fixed width (`w-[420px]`). The `min-w-0` on the chat area prevents flex items from overflowing.

### 7.3 Progressive Disclosure

The itinerary panel only appears when:
1. The user clicks "View Itinerary" on a completed message (`showPanel = true`)
2. AND there is actually an itinerary in the Redux store (`itinerary !== null`)

This keeps the UI clean — new users see a simple two-panel layout (sidebar + chat) until their first itinerary generates.

---

## 8. Chat System Implementation

### 8.1 ChatMessage Type

```typescript
export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
  taskId?: string;                    // Links message to backend task
  itinerary?: StructuredItinerary;    // Attached on completion
  toolTrace?: ToolTrace[];            // AI tools used
  status?: TaskStatus;                // PROCESSING | COMPLETED | FAILED
  progress?: number;                  // 0-100
  progressMessage?: string;           // "Researching destinations..."
}
```

**Design decision**: Chat messages live in Redux (`chatSlice.messages`) rather than component-local state because:

1. **Persistence across navigation**: If a user clicks away and comes back, messages are still there
2. **SSE integration**: The `useSSE` hook dispatches directly to the store, updating the last assistant message in-place as progress events arrive
3. **Testing**: Redux state is easily testable without rendering components
4. **Cross-component access**: Both ChatArea and ItineraryPanel read from the same message state

### 8.2 MessageBubble Design

The `MessageBubble` component renders differently based on `message.role` and `message.status`:

| Role | Status | Rendering |
|---|---|---|
| `user` | — | Blue bubble, right-aligned, with user avatar |
| `assistant` | `PROCESSING` | White bubble, left-aligned, spinner + progress bar |
| `assistant` | `COMPLETED` | White bubble, text + "View Itinerary" button |
| `assistant` | `FAILED` | White bubble, error icon + failure message |

**In-place update pattern**: When SSE events arrive, the chatSlice's `setProgress` reducer mutates the last assistant message in `messages[]` directly (Immer makes this safe):

```typescript
setProgress(state, action) {
  const lastMsg = state.messages[state.messages.length - 1];
  if (lastMsg?.role === 'assistant' && lastMsg.status !== 'COMPLETED') {
    lastMsg.progress = action.payload.progress;
    lastMsg.progressMessage = action.payload.message;
    lastMsg.content = action.payload.message;
  }
}
```

This avoids adding a new message for every progress event — the same assistant bubble smoothly updates its progress bar and text.

### 8.3 ChatInput: Auto-Resize Textarea

```typescript
export function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [value, setValue] = useState('');
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize on content change
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 200)}px`;
    }
  }, [value]);

  // Enter to send, Shift+Enter for newline
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit(e);
    }
  };
}
```

**Why auto-resize?** Travel planning prompts can be long ("Plan a 5-day trip to Tokyo for cherry blossom season. Budget: $2000. Interests: food, culture, temples. Prefer mid-range hotels near Shinjuku."). A fixed single-line input would hide most of the text.

### 8.4 ChatArea: Orchestrating Messages and Submission

```typescript
export function ChatArea({ onViewItinerary }: ChatAreaProps) {
  const dispatch = useAppDispatch();
  const { messages, currentTaskId, currentProjectId, loading } = useAppSelector((s) => s.chat);

  useSSE(currentTaskId);  // Real-time updates

  const handleSend = (text: string) => {
    dispatch(addUserMessage(text));  // Optimistic: show immediately
    dispatch(submitPlanning({
      requirements: text,
      ...(currentProjectId ? { projectId: currentProjectId } : {}),
    })).then(() => {
      dispatch(fetchProjects());  // Refresh sidebar
    });
  };
}
```

**Key detail**: `currentProjectId` is passed to the backend so follow-up messages go to the same project. When `null` (new chat), the backend auto-creates a new project and returns the `projectId` in the response.

---

## 9. Project Management

### 9.1 Backend REST API

| Method | Path | Description |
|---|---|---|
| GET | `/api/projects` | List user's active projects (sorted by updatedAt) |
| GET | `/api/projects/{projectId}` | Get single project details |
| PUT | `/api/projects/{projectId}` | Rename project |
| DELETE | `/api/projects/{projectId}` | Archive (soft-delete) project |

### 9.2 Sidebar Component

The Sidebar fetches projects on mount and handles three actions:

1. **New Chat**: Resets chat state and deselects active project
2. **Select Project**: Sets active project, sets `currentProjectId` in chat, loads conversation history
3. **Delete Project**: Soft-deletes after confirmation

```typescript
const handleSelectProject = (projectId: string) => {
  dispatch(setActiveProject(projectId));           // Highlight in sidebar
  dispatch(setCurrentProjectId(projectId));         // Wire up for follow-ups
  dispatch(loadConversationHistory(projectId));      // Load past messages
};
```

### 9.3 Project Auto-Creation

When the user sends the first message in a new chat (no `currentProjectId`), the backend's `PlanningController` auto-creates a project:

```
Frontend: POST /api/planning/generate { requirements: "..." }
Backend:  Creates project with title extracted from requirements
          Returns { taskId, projectId }
Frontend: chatSlice stores projectId → follow-up messages use it
Frontend: fetchProjects() refreshes sidebar → new project appears
```

---

## 10. Itinerary Display and Tool Trace

### 10.1 Itinerary Structure

The `StructuredItinerary` type mirrors the Java backend's `StructuredItinerary` class:

```typescript
StructuredItinerary
├── metadata: ItineraryMetadata
│   ├── destination: string         // "Tokyo, Japan"
│   ├── startDate / endDate: string // "2025-04-01"
│   ├── totalDays: number           // 5
│   ├── budget: string              // "$2000"
│   └── interests: string[]         // ["food", "culture"]
├── days: DailyItinerary[]
│   ├── dayNumber: number           // 1
│   ├── date: string                // "2025-04-01"
│   ├── theme: string               // "Arrival & Shinjuku"
│   └── activities: Activity[]
│       ├── activityId: string      // "act-1"
│       ├── time: string            // "09:00 - 12:00"
│       ├── title: string           // "Senso-ji Temple"
│       ├── description: string     // "Visit Tokyo's oldest temple..."
│       ├── location: Location      // { name, latitude, longitude, address }
│       ├── type: string            // "SIGHTSEEING"
│       ├── estimatedCost: string   // "$15"
│       └── tips: string            // "Visit early morning to avoid crowds"
└── tips: string[]                  // General travel tips
```

### 10.2 Fixing React Error #31

**Root cause**: The original `ItineraryDisplay.tsx` rendered `{activity.location}` directly in JSX. But `location` is a `Location` object (`{ name, latitude, longitude, address, placeType }`), not a string. React cannot render objects as children — this triggers [React Error #31](https://react.dev/errors/31).

**Fix**: Access specific properties:

```tsx
{activity.location && (
  <p className="text-xs text-gray-400">
    {activity.location.name}
    {activity.location.address && ` - ${activity.location.address}`}
  </p>
)}
```

### 10.3 ItineraryPanel Tabs

The panel has two tabs:

1. **Itinerary Tab**: Renders metadata card, day cards with activity rows, and travel tips
2. **Tools Tab**: Shows expandable list of AI tools used during generation (geocode, weather, currency, etc.)

```
┌─────────────────────────────────────────────────┐
│  🔧 Tool Trace (5 tools called)  3/5 succeeded  │
│                                   245ms total    │
├─────────────────────────────────────────────────┤
│  1. ● get_weather_forecast        120ms  [▼]     │
│  2. ● convert_currency             45ms  [▶]     │
│  3. ○ get_holidays                 80ms  [▶]     │
│  4. ● calculate_distance           30ms  [▶]     │
│  5. ● resolve_timezone             15ms  [▶]     │
└─────────────────────────────────────────────────┘
  ● = success (green)   ○ = failed (red)
  [▼] = expanded (shows arguments JSON)
  [▶] = collapsed
```

This transparency helps users understand why certain recommendations were made and builds trust in the AI system.

---

## 11. Authentication and Google OAuth2

### 11.1 Authentication Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│              Auth Flows                                           │
│                                                                  │
│  Flow 1: Email/Password                                          │
│  LoginForm → POST /api/auth/login → {token, user}               │
│  → Store in Redux + Cookie → Navigate to /                       │
│                                                                  │
│  Flow 2: Google OAuth2                                           │
│  LoginForm → window.location = /oauth2/authorization/google      │
│  → Nginx/Vite proxy → Java backend → Google consent screen       │
│  → Google callback → Spring Security → JWT generated             │
│  → Redirect to /auth/callback?token=JWT                          │
│  → AuthCallbackPage → setToken(JWT) → fetchCurrentUser()         │
│  → Navigate to /                                                 │
│                                                                  │
│  Flow 3: Token Restoration (page refresh)                        │
│  App mount → read token from cookie → fetchCurrentUser()         │
│  → If valid: user restored → continue                            │
│  → If invalid/expired: clear cookie → redirect to /login         │
└─────────────────────────────────────────────────────────────────┘
```

### 11.2 OAuth2 Callback Page

```typescript
// src/pages/AuthCallbackPage.tsx
export function AuthCallbackPage() {
  const [searchParams] = useSearchParams();
  const dispatch = useAppDispatch();
  const navigate = useNavigate();

  useEffect(() => {
    const token = searchParams.get('token');
    if (token) {
      dispatch(setToken(token));           // Store JWT
      dispatch(fetchCurrentUser()).then(() => {
        navigate('/', { replace: true });  // Go to main app
      });
    } else {
      navigate('/login', { replace: true });
    }
  }, [searchParams, dispatch, navigate]);

  return <div>Signing you in...</div>;
}
```

### 11.3 Google Login Button

```typescript
const handleGoogleLogin = () => {
  // Navigate to backend's OAuth2 endpoint (proxied via Vite/Nginx)
  window.location.href = '/oauth2/authorization/google';
};
```

**Why `window.location.href` and not `fetch()`?** OAuth2 requires full browser redirects:
1. Browser navigates to `/oauth2/authorization/google`
2. Spring Security redirects to `https://accounts.google.com/...`
3. User consents → Google redirects to `/login/oauth2/code/google`
4. Spring Security processes the code, generates JWT
5. Backend redirects to `http://frontend/auth/callback?token=JWT`

This multi-hop redirect chain cannot be done with `fetch()` — it requires full page navigation.

### 11.4 AuthGuard Component

```typescript
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { token } = useAppSelector((s) => s.auth);
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <>{children}</>;
}
```

**Design**: `AuthGuard` wraps the main app routes. If no token exists, it redirects to `/login`. This is a declarative pattern — the guard re-evaluates whenever `token` changes (e.g., on logout).

---

## 12. Cross-Language Serialization: Java ↔ TypeScript

### 12.1 The Snake Case Problem

```
┌─────────────────────────────────────────────────────────────────┐
│              Serialization Chain                                  │
│                                                                  │
│  Python Worker (snake_case)                                      │
│  ──▶ Kafka (JSON string)                                         │
│  ──▶ Java Backend (camelCase) @JsonAlias("snake_case")           │
│  ──▶ SSE / REST API (camelCase JSON)                             │
│  ──▶ TypeScript Frontend (camelCase types)                       │
│                                                                  │
│  Example field: "start_date"                                     │
│                                                                  │
│  Python sends:     { "start_date": "2025-04-01" }               │
│  Java receives:    startDate (via @JsonAlias("start_date"))      │
│  Java serializes:  { "startDate": "2025-04-01" }                │
│  TypeScript reads: metadata.startDate                            │
│                                                                  │
│  Why @JsonAlias and not @JsonProperty?                           │
│  @JsonProperty("start_date") → serializes AS "start_date"       │
│  @JsonAlias("start_date")    → accepts "start_date" on input    │
│                                 but serializes as "startDate"    │
│                                                                  │
│  We need camelCase OUTPUT for the TypeScript frontend.           │
│  We need snake_case INPUT from the Python worker.                │
│  @JsonAlias gives us both.                                       │
└─────────────────────────────────────────────────────────────────┘
```

### 12.2 Java DTO with @JsonAlias

```java
// StructuredItinerary.ItineraryMetadata (Java)
@Data @Builder @NoArgsConstructor @AllArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public static class ItineraryMetadata {
    private String destination;
    @JsonAlias("start_date") private String startDate;
    @JsonAlias("end_date")   private String endDate;
    @JsonAlias("total_days") private Integer totalDays;
    private String budget;
    private List<String> interests;
}
```

### 12.3 TypeScript Mirror Type

```typescript
// src/types/index.ts
export interface ItineraryMetadata {
  destination: string;
  startDate: string;    // camelCase — matches Java's default serialization
  endDate: string;
  totalDays: number;
  budget: string;
  interests: string[];
}
```

### 12.4 KafkaConsumerService: Deserializing the Itinerary

The Python worker sends `itinerary_json` as a raw string through Kafka. The Java `KafkaConsumerService` must explicitly deserialize it:

```java
// KafkaConsumerService.handleCompletedResult()
StructuredItinerary structuredItinerary = objectMapper.readValue(
    event.getItineraryJson(), StructuredItinerary.class);
taskService.markCompleted(taskId, structuredItinerary, event.getItineraryJson());
```

Without this step, `structuredItinerary` would be `null` in the `TaskStatusResponse` sent via SSE, and the frontend would never receive structured data.

---

## 13. API Client and Proxy Architecture

### 13.1 ApiClient Class

```typescript
// src/api/client.ts
class ApiClient {
  private getToken(): string | undefined {
    return Cookies.get('token');
  }

  private getHeaders(json = true): HeadersInit {
    const headers: HeadersInit = {};
    const token = this.getToken();
    if (token) headers['Authorization'] = `Bearer ${token}`;
    if (json) headers['Content-Type'] = 'application/json';
    return headers;
  }

  async get<T>(path: string): Promise<T>     { /* fetch GET */  }
  async post<T>(path: string, body?): Promise<T>  { /* fetch POST */ }
  async put<T>(path: string, body?): Promise<T>   { /* fetch PUT */  }
  async delete(path: string): Promise<void>  { /* fetch DELETE */ }

  createSSE(path: string): EventSource {
    const token = this.getToken();
    const url = `/api${path}${token ? `?token=${token}` : ''}`;
    return new EventSource(url);
  }
}
```

**Why pass JWT as query param for SSE?** The `EventSource` API doesn't support custom headers. The only way to authenticate is via:
1. Query parameters (our approach): `/api/planning/tasks/{id}/stream?token=JWT`
2. Cookies (requires `withCredentials` and cookie-based auth)

We chose query params because the rest of the app uses `Authorization: Bearer` headers, not session cookies.

### 13.2 Error Handling

```typescript
export class ApiError extends Error {
  status: number;
  body: string;

  constructor(status: number, body: string) {
    super(`API Error ${status}: ${body}`);
    this.name = 'ApiError';
    this.status = status;
    this.body = body;
  }
}
```

The `ApiClient` throws `ApiError` for non-2xx responses. Redux `rejected` thunk cases catch these and display user-friendly messages without exposing stack traces.

### 13.3 Proxy Architecture (Dev vs Prod)

```
┌─────────────────────────────────────────────────────────────────┐
│  Development (Vite Dev Server)                                   │
│                                                                  │
│  Browser :5173 → Vite Dev Server                                 │
│    /api/*        → proxy → localhost:8081                        │
│    /oauth2/*     → proxy → localhost:8081                        │
│    /login/oauth2 → proxy → localhost:8081                        │
│    everything else → serve React (HMR)                           │
│                                                                  │
│  Production (Nginx in Docker)                                    │
│                                                                  │
│  Browser :3000 → Nginx                                           │
│    /api/*        → proxy → java-backend:8081                    │
│    /oauth2/*     → proxy → java-backend:8081                    │
│    /login/oauth2 → proxy → java-backend:8081                    │
│    /actuator/*   → proxy → java-backend:8081                    │
│    everything else → serve static files + SPA fallback           │
└─────────────────────────────────────────────────────────────────┘
```

---

## 14. Security Considerations

### 14.1 XSS Prevention
- React auto-escapes JSX content by default
- `dangerouslySetInnerHTML` is never used
- All user input is rendered as text, never as HTML
- Itinerary data from the AI is rendered through typed component props, never injected as raw HTML

### 14.2 JWT Token Handling
- Stored in `js-cookie` with 1-day expiration (not `localStorage`, reducing XSS surface)
- Sent as `Authorization: Bearer` header for REST API calls
- Sent as `?token=` query parameter for SSE connections (EventSource limitation)
- `fetchCurrentUser` validates token on app mount; if invalid, clears auth state

### 14.3 OAuth2 Security
- Spring Security's OAuth2 flow uses the `state` parameter to prevent CSRF attacks
- The JWT token appears in the URL only briefly during the `/auth/callback?token=JWT` redirect
- `AuthCallbackPage` stores the token and immediately navigates away with `replace: true`, removing the token from browser history

### 14.4 API Proxy
- Dev server proxy prevents exposing backend URLs to the browser
- Production: Nginx handles routing, no CORS needed (same-origin)
- Nginx adds security headers: `X-Frame-Options`, `X-Content-Type-Options`, `X-XSS-Protection`

### 14.5 Token Storage: Cookie vs localStorage

| Storage | XSS Risk | CSRF Risk | Persistence |
|---|---|---|---|
| `localStorage` | High (any JS can read) | None | Until cleared |
| `sessionStorage` | High (any JS can read) | None | Tab lifetime |
| `js-cookie` | Medium (JS can read) | Low (not auto-sent) | Configurable |
| `httpOnly cookie` | None (JS can't read) | Medium (auto-sent) | Configurable |

We use `js-cookie` because:
- The API client needs to read the token for `Authorization` header
- `httpOnly` cookies would require the backend to set cookies via `Set-Cookie` header
- We mitigate the XSS risk by never using `dangerouslySetInnerHTML`

In a future production upgrade, the backend should set `httpOnly` + `Secure` + `SameSite=Strict` cookies, and the API should use cookie-based auth.

---

## 15. Testing Strategies

### 15.1 Testing Pyramid

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│              ┌───────────┐                                       │
│              │   E2E     │  Playwright/Cypress (future)          │
│              ├───────────┤                                       │
│            ┌───────────────┐                                     │
│            │  Component    │  React Testing Library               │
│            │    Tests      │  Render + assert DOM                 │
│            ├───────────────┤                                     │
│          ┌───────────────────┐                                   │
│          │    Unit Tests      │  Redux slices, utils, hooks      │
│          └────────────────────┘                                   │
│                                                                  │
│  Tools: Vitest + @testing-library/react + happy-dom              │
└─────────────────────────────────────────────────────────────────┘
```

### 15.2 Testing Redux Slices

Test slices by creating a real store and dispatching actions:

```typescript
it('should handle setProgress', () => {
  const store = configureStore({ reducer: { chat: chatReducer } });
  store.dispatch(setProgress({
    status: 'PROCESSING',
    progress: 50,
    message: 'Working...'
  }));
  expect(store.getState().chat.progress).toBe(50);
  expect(store.getState().chat.status).toBe('PROCESSING');
});
```

```typescript
it('should handle setCompleted with structured itinerary', () => {
  const store = configureStore({ reducer: { chat: chatReducer } });
  // Add an assistant message first (simulating submitPlanning.fulfilled)
  store.dispatch(addUserMessage('Plan a trip'));

  const itinerary: StructuredItinerary = {
    metadata: { destination: 'Tokyo', startDate: '2025-04-01', ... },
    days: [{ dayNumber: 1, activities: [...] }],
    tips: ['Buy a JR Pass']
  };

  store.dispatch(setCompleted({ itinerary, toolTrace: [] }));
  expect(store.getState().chat.itinerary?.metadata.destination).toBe('Tokyo');
  expect(store.getState().chat.status).toBe('COMPLETED');
});
```

### 15.3 Testing Components

Use `renderWithProviders` helper that wraps components in Provider + BrowserRouter:

```typescript
function renderWithProviders(
  ui: React.ReactElement,
  store = configureStore({
    reducer: { auth: authReducer, chat: chatReducer, projects: projectsReducer }
  })
) {
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
}
```

```typescript
it('should render user message', () => {
  const message: ChatMessage = {
    id: 'msg-1',
    role: 'user',
    content: 'Plan a trip to Tokyo',
    timestamp: new Date().toISOString(),
  };
  renderWithProviders(<MessageBubble message={message} />);
  expect(screen.getByText('Plan a trip to Tokyo')).toBeInTheDocument();
});
```

### 15.4 Test Coverage Summary

**Store Tests (18 tests):**
- `authSlice`: Initial state, setUser, setToken, logout, clearError
- `chatSlice`: Initial state, addUserMessage, setProgress, setCompleted (with structured itinerary and tool traces), setFailed, setSseConnected, resetChat, clearChatForProject
- `projectsSlice`: Initial state, setActiveProject, addProject, clearProjects

**Component Tests (8 tests):**
- `ChatInput`: Renders correctly, calls onSend on submit, respects disabled prop
- `MessageBubble`: Renders user/assistant messages, shows processing state with spinner, shows "View Itinerary" button, shows failed state

---

## 16. Production Considerations

### 16.1 Build Optimization
- Vite uses Rollup for production builds with tree-shaking
- Code splitting via dynamic `import()` for route-based splitting
- Asset hashing (`index-BEP5x5lh.js`) for cache-busting
- Static assets served with `Cache-Control: public, immutable` (1 year)

### 16.2 Environment Variables
- `VITE_API_URL` for configurable backend URL (if needed)
- All `VITE_*` variables are embedded at build time — they are NOT secret-safe
- Never put API keys or secrets in `VITE_*` variables

### 16.3 Error Boundaries
- Add React Error Boundaries around route components
- Catch render errors gracefully instead of white screen
- React Error #31 (rendering objects as children) was the original bug that motivated the frontend redesign

### 16.4 SSE Reconnection
- EventSource auto-reconnects on network errors by default
- Our hook closes the connection on terminal events (COMPLETED, FAILED, CANCELLED) to prevent infinite reconnect
- Consider maximum reconnect attempts with exponential backoff for degraded network conditions
- Show "Reconnecting..." UI state to users

### 16.5 Docker Production Build

```dockerfile
# Multi-stage build:
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY docker/nginx.conf /etc/nginx/conf.d/default.conf

HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
    CMD wget -q --spider http://127.0.0.1:80/ || exit 1
```

**Image size**: ~25MB (Nginx Alpine + static assets). Compared to ~500MB+ for a Node.js server serving the same files.

---

## 17. Hands-On Exercises

### Exercise 1: Run the Full Stack Locally

```bash
# Start backend services
cd voyageai-backend
docker-compose up -d

# Start frontend dev server (connects via Vite proxy)
cd voyageai-web
npm install
npm run dev
# Open http://localhost:5173
```

### Exercise 2: Add a Dark Mode Toggle
Implement a dark mode toggle using Tailwind's `dark:` variant classes and Redux state:
1. Add `darkMode: boolean` to `authSlice` (or a new `uiSlice`)
2. Create a toggle button in the Sidebar
3. Apply `className={darkMode ? 'dark' : ''}` to the root `<html>` element
4. Use `dark:bg-gray-900` and `dark:text-white` in components

### Exercise 3: Add a Map View to the Itinerary Panel
Add a third tab "Map" to the `ItineraryPanel` that plots activity locations:
1. Install `leaflet` and `react-leaflet`
2. Extract `latitude` and `longitude` from all activities
3. Render markers on a map with popup labels (activity title + time)
4. Clicking a marker scrolls to that activity in the Itinerary tab

### Exercise 4: Implement Project Rename
The backend already supports `PUT /api/projects/{id}`. Add a rename feature:
1. Double-click a project in the Sidebar to enter edit mode
2. Show an inline text input
3. On Enter, dispatch `renameProject({projectId, title})`
4. On Escape, cancel editing

### Exercise 5: Add Error Boundaries
Wrap the `ItineraryPanel` in a React Error Boundary:
```tsx
class ItineraryErrorBoundary extends React.Component {
  state = { hasError: false };
  static getDerivedStateFromError() { return { hasError: true }; }
  render() {
    if (this.state.hasError) {
      return <p>Failed to render itinerary. Try again.</p>;
    }
    return this.props.children;
  }
}
```

### Exercise 6: Add Typing Indicators
Show a "..." typing animation while waiting for the SSE connection:
1. In `submitPlanning.pending`, set `status: 'PENDING'`
2. In the `MessageBubble`, render three bouncing dots for `PENDING` status
3. Transition to the progress bar when the first `progress` event arrives

### Exercise 7: Implement Message Search
Add a search bar to the Sidebar that filters projects by title or message content:
1. Add a search input above the project list
2. Filter `projects` array by `title.includes(query)`
3. For deeper search, call a backend endpoint that searches conversation messages

### Exercise 8: Write an Integration Test
Write a Vitest test that simulates the full flow:
1. Mock the API response for `submitPlanning`
2. Render `ChatArea` with a test store
3. Type a message in `ChatInput` and submit
4. Assert that the user message bubble appears
5. Assert that the assistant "typing" bubble appears
6. Dispatch `setCompleted` with a mock itinerary
7. Assert that "View Itinerary" button appears

---

*Module 14 builds the complete user-facing layer of VoyageAI. The three-panel ChatGPT-style layout, powered by Redux Toolkit and Server-Sent Events, connects every backend capability — authentication, project management, real-time AI generation progress, and structured itinerary display — into a smooth, responsive experience. The combination of Vite's instant development feedback, Tailwind's utility-first styling, and SSE's real-time streaming creates a production-quality frontend that mirrors how modern AI applications are built.*
