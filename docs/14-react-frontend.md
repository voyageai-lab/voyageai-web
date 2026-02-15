# Module 14: React Frontend - Building a Real-Time AI Travel Planner UI

## Table of Contents

1. [Overview](#1-overview)
2. [Theoretical Foundations](#2-theoretical-foundations)
3. [Architecture Design](#3-architecture-design)
4. [Vite + React + TypeScript Setup](#4-vite--react--typescript-setup)
5. [Redux Toolkit State Management](#5-redux-toolkit-state-management)
6. [Server-Sent Events (SSE) Integration](#6-server-sent-events-sse-integration)
7. [Component Design Patterns](#7-component-design-patterns)
8. [Authentication Flow](#8-authentication-flow)
9. [Itinerary Display and Tool Trace](#9-itinerary-display-and-tool-trace)
10. [Security Considerations](#10-security-considerations)
11. [Testing Strategies](#11-testing-strategies)
12. [Production Considerations](#12-production-considerations)
13. [Hands-On Exercises](#13-hands-on-exercises)

---

## 1. Overview

### What This Module Covers

This module builds a production-quality React frontend that connects to the Java backend via REST APIs and SSE (Server-Sent Events) for real-time progress updates during AI itinerary generation.

```
┌─────────────────────────────────────────────────────────────────┐
│                  Frontend Architecture                            │
│                                                                  │
│  ┌──────────────────────────────────────────────────────┐       │
│  │                   React (Vite)                        │       │
│  │                                                        │       │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────────┐    │       │
│  │  │  Auth    │  │ Planning │  │ Itinerary Display │    │       │
│  │  │  Pages   │  │   Form   │  │ + Tool Trace      │    │       │
│  │  └────┬─────┘  └────┬─────┘  └────────┬─────────┘    │       │
│  │       │              │                  │               │       │
│  │       ▼              ▼                  │               │       │
│  │  ┌──────────────────────────────────────┐               │       │
│  │  │        Redux Toolkit Store            │               │       │
│  │  │  authSlice │ planningSlice            │               │       │
│  │  └──────────────────┬───────────────────┘               │       │
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
│  │     Vite Dev Server Proxy    │  /api/* → localhost:8081       │
│  └──────────────┬───────────────┘                                │
│                 │                                                 │
│                 ▼                                                 │
│  ┌──────────────────────────────┐                                │
│  │     Java Backend (8081)      │                                │
│  │  POST /api/planning/generate │                                │
│  │  GET  /api/planning/tasks/   │                                │
│  │       {id}/stream (SSE)      │                                │
│  └──────────────────────────────┘                                │
└─────────────────────────────────────────────────────────────────┘
```

### Module Learning Objectives

By the end of this module, you will:

- Set up a Vite + React + TypeScript project with Tailwind CSS
- Implement Redux Toolkit for global state management
- Build a real-time SSE hook for streaming progress updates
- Create a responsive itinerary display with expandable tool trace
- Implement JWT-based authentication with secure cookie storage
- Write comprehensive tests with Vitest and React Testing Library

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
│  Jotai/Recoil      Atomic state               No (different      │
│                                               paradigm)           │
│                                                                  │
│  Why RTK? Our app has:                                            │
│  - Async thunks (login, register, submitPlanning)                │
│  - Cross-component state (auth token used everywhere)            │
│  - SSE events dispatching actions from outside React             │
│  - DevTools for debugging state transitions                      │
└─────────────────────────────────────────────────────────────────┘
```

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
│                                                                  │
│  Our use case: Server pushes progress updates to client.         │
│  Client never needs to send data to the stream.                  │
│  SSE is the perfect fit — simpler, auto-reconnect, HTTP-native. │
│                                                                  │
│  SSE Event Format:                                                │
│  event: progress                                                  │
│  data: {"status":"PROCESSING","progress":50,"message":"..."}     │
│                                                                  │
│  event: completed                                                 │
│  data: {"status":"COMPLETED","result":"{...itinerary...}"}       │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Architecture Design

### 3.1 Component Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│  App (Router + Provider)                                         │
│  ├── Navbar                                                      │
│  ├── Routes                                                      │
│  │   ├── / → HomePage                                            │
│  │   ├── /login → LoginForm                                      │
│  │   ├── /register → RegisterForm                                │
│  │   └── /planning → PlanningPage                                │
│  │       ├── PlanningForm (input + submit)                       │
│  │       ├── ProgressBar (SSE-driven progress)                   │
│  │       ├── ToolTracePanel (expandable tool details)            │
│  │       └── ItineraryDisplay (day-by-day activities)            │
│  │                                                               │
│  Store                                                           │
│  ├── authSlice (user, token, login/register thunks)              │
│  └── planningSlice (task, progress, itinerary, SSE state)        │
│                                                                  │
│  Hooks                                                           │
│  └── useSSE(taskId) → connects EventSource, dispatches actions   │
│                                                                  │
│  API Client                                                      │
│  └── apiClient.get/post/createSSE → fetch + JWT header           │
└─────────────────────────────────────────────────────────────────┘
```

### 3.2 Data Flow for Planning

```
┌─────────────────────────────────────────────────────────────────┐
│              Planning Data Flow                                   │
│                                                                  │
│  1. User types requirements in PlanningForm                      │
│  2. Form dispatches submitPlanning() thunk                       │
│  3. Thunk POSTs to /api/planning/generate                        │
│  4. Backend returns { taskId, status: "PROCESSING" }             │
│  5. planningSlice stores taskId                                  │
│  6. useSSE(taskId) opens EventSource connection                  │
│  7. SSE events arrive:                                           │
│     - "progress" → dispatch(setProgress(...))                    │
│       → ProgressBar re-renders with new %                        │
│     - "completed" → dispatch(setCompleted({itinerary}))          │
│       → ItineraryDisplay renders day-by-day view                 │
│     - "failed" → dispatch(setFailed(error))                      │
│       → Error message shown                                      │
│  8. EventSource closes on terminal event                         │
│                                                                  │
│  ┌──────┐ POST  ┌──────┐ SSE  ┌──────┐ dispatch ┌──────┐      │
│  │ Form │──────▶│ API  │─────▶│ Hook │─────────▶│ Store│      │
│  └──────┘       └──────┘      └──────┘          └───┬──┘      │
│                                                      │          │
│                                              ┌───────┴────┐     │
│                                              │ Components │     │
│                                              │ re-render  │     │
│                                              └────────────┘     │
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

### 4.2 Tailwind CSS v4 Integration

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

### 4.3 Path Aliases

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

Now imports become: `import { Navbar } from '@/components/layout/Navbar'`

### 4.4 Dev Server Proxy

The Vite dev server proxies API requests to the Java backend:

```typescript
server: {
  port: 5173,
  proxy: {
    '/api': {
      target: 'http://localhost:8081',
      changeOrigin: true,
    },
  },
}
```

This eliminates CORS issues in development. The browser sees all requests going to `localhost:5173`, and Vite forwards `/api/*` to `localhost:8081`.

---

## 5. Redux Toolkit State Management

### 5.1 Store Configuration

```typescript
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './authSlice';
import planningReducer from './planningSlice';

export const store = configureStore({
  reducer: {
    auth: authReducer,
    planning: planningReducer,
  },
});
```

`configureStore` automatically includes:
- Redux DevTools integration
- `redux-thunk` middleware
- Immutability checks (development only)
- Serializability checks (development only)

### 5.2 Typed Hooks

```typescript
export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
```

These typed hooks prevent type casting everywhere and provide autocomplete for state access.

### 5.3 createAsyncThunk for API Calls

```typescript
export const submitPlanning = createAsyncThunk<
  PlanningSubmitResponse,  // Return type
  PlanningRequest          // Argument type
>('planning/submit', async (request) => {
  return apiClient.post<PlanningSubmitResponse>('/planning/generate', request);
});
```

`createAsyncThunk` automatically dispatches:
- `planning/submit/pending` → set loading state
- `planning/submit/fulfilled` → store taskId
- `planning/submit/rejected` → set error

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
│  ├── Create EventSource(/api/planning/tasks/{id}/stream)         │
│  ├── dispatch(setSseConnected(true))                             │
│  │                                                               │
│  ├── Listen for "progress" events                                │
│  │   └── dispatch(setProgress({status, progress, message}))      │
│  │                                                               │
│  ├── Listen for "completed" events                               │
│  │   ├── Parse itinerary JSON from result field                  │
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

### 6.2 EventSource API

The browser's `EventSource` API handles SSE connections:

```typescript
const es = new EventSource('/api/planning/tasks/task-123/stream');

// Named events
es.addEventListener('progress', (event) => {
  const data = JSON.parse(event.data);
  console.log(data.progress);  // 50
});

// Default event
es.onmessage = (event) => { ... };

// Error handling + auto-reconnect
es.onerror = (event) => {
  // EventSource automatically reconnects on error
  // Unless we call es.close()
};
```

### 6.3 SSE Event Types from Java Backend

The Java `TaskStreamController` sends these event types:

| Event Name | When | Data |
|---|---|---|
| `status` | Initial connection | Current task state |
| `progress` | During processing | `{status, progress, message}` |
| `completed` | Task finished | `{status, result (itinerary JSON)}` |
| `failed` | Task errored | `{status, errorMessage}` |

---

## 7. Component Design Patterns

### 7.1 Container vs Presentational

- **PlanningPage** (container): Connects to Redux, manages SSE hook, orchestrates child components
- **ProgressBar** (presentational): Reads from Redux selector, renders progress UI
- **ItineraryDisplay** (presentational): Receives itinerary data from Redux, renders day cards

### 7.2 Conditional Rendering Chain

```tsx
<PlanningForm />           {/* Always visible */}
{error && <ErrorBanner />} {/* Only on error */}
<ProgressBar />            {/* Renders null when no status */}
<ToolTracePanel />         {/* Renders null when no traces */}
<ItineraryDisplay />       {/* Renders null when no itinerary */}
```

Each component self-guards with early returns, keeping the parent clean.

---

## 8. Authentication Flow

```
┌─────────────────────────────────────────────────────────────────┐
│              Auth Flow                                            │
│                                                                  │
│  1. User fills LoginForm → dispatches login() thunk              │
│  2. Thunk POST /api/auth/login → returns {token, username}       │
│  3. authSlice stores token in Redux + js-cookie                  │
│  4. ApiClient reads token from cookie for all requests           │
│  5. PlanningPage checks token → redirects to /login if absent    │
│  6. Logout clears Redux + cookie → redirects to /login           │
│                                                                  │
│  Token Storage: js-cookie (not localStorage)                      │
│  - Cookies are automatically sent with same-origin requests      │
│  - Can set httpOnly in production (via Set-Cookie header)        │
│  - Expires: 1 day                                                │
└─────────────────────────────────────────────────────────────────┘
```

---

## 9. Itinerary Display and Tool Trace

### 9.1 Itinerary Structure

The itinerary JSON from the AI pipeline maps to a nested component tree:

```
Itinerary
├── Header (destination, dates, budget, travelers, summary)
└── Days[]
    ├── DayCard (day number, theme, date, daily budget)
    └── Activities[]
        └── ActivityRow (time, name, description, location, cost, tips)
```

### 9.2 Tool Trace Panel

The tool trace panel shows developers and users what tools the AI used:

```
┌─────────────────────────────────────────────────┐
│  🔧 Tool Trace (5 tools called)  3/5 succeeded  │
│                                   245ms total    │
├─────────────────────────────────────────────────┤
│  1. ✅ get_weather_forecast        120ms  [Args] │
│  2. ✅ convert_currency             45ms  [Args] │
│  3. ❌ get_holidays                 80ms  [Args] │
│  4. ✅ calculate_distance           30ms  [Args] │
│  5. ✅ resolve_timezone             15ms  [Args] │
└─────────────────────────────────────────────────┘
```

This transparency helps users understand why certain recommendations were made and builds trust in the AI system.

---

## 10. Security Considerations

### 10.1 XSS Prevention
- React auto-escapes JSX content by default
- `dangerouslySetInnerHTML` is never used
- All user input is rendered as text, never as HTML

### 10.2 CSRF Protection
- JWT tokens are sent via `Authorization: Bearer` header, not cookies
- No cookie-based session = no CSRF risk

### 10.3 Token Storage
- Development: `js-cookie` with `expires: 1` (1 day)
- Production: Use `httpOnly` + `Secure` + `SameSite=Strict` cookies set by the backend

### 10.4 API Proxy
- Dev server proxy prevents exposing backend URLs to the browser
- Production: Nginx/CDN handles routing, no CORS needed

---

## 11. Testing Strategies

### 11.1 Testing Pyramid

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

### 11.2 Testing Redux Slices

Test slices by creating a real store and dispatching actions:

```typescript
it('should handle setProgress', () => {
  const store = configureStore({ reducer: { planning: planningReducer } });
  store.dispatch(setProgress({ status: 'PROCESSING', progress: 50, message: 'Working...' }));
  expect(store.getState().planning.progress).toBe(50);
});
```

### 11.3 Testing Components

Use `renderWithProviders` helper that wraps components in Provider + BrowserRouter:

```typescript
function renderWithProviders(ui: React.ReactElement, store = createTestStore()) {
  return render(
    <Provider store={store}>
      <BrowserRouter>{ui}</BrowserRouter>
    </Provider>
  );
}
```

---

## 12. Production Considerations

### 12.1 Build Optimization
- Vite uses Rollup for production builds with tree-shaking
- Code splitting via `React.lazy()` for route-based splitting
- Asset hashing for cache-busting

### 12.2 Environment Variables
- `VITE_API_URL` for configurable backend URL
- All `VITE_*` variables are embedded at build time (not secret-safe)

### 12.3 Error Boundaries
- Add React Error Boundaries around route components
- Catch render errors gracefully instead of white screen

### 12.4 SSE Reconnection
- EventSource auto-reconnects on network errors
- Consider maximum reconnect attempts with exponential backoff
- Show "Reconnecting..." UI state to users

---

## 13. Hands-On Exercises

### Exercise 1: Add Dark Mode Toggle
Implement a dark mode toggle using Tailwind's `dark:` variant classes and Redux state.

### Exercise 2: Itinerary Map View
Add a map component (Leaflet or Google Maps) that plots activity locations from the itinerary.

### Exercise 3: Planning History
Create a `/history` page that lists past planning tasks by fetching from `/api/planning/tasks`.

### Exercise 4: Optimistic Updates
Implement optimistic UI for the planning form — show a "Submitted!" message before the server responds.

### Exercise 5: Error Boundaries
Add a React Error Boundary that catches rendering errors in the itinerary display and shows a fallback UI.

---

*Module 14 completes the user-facing layer of VoyageAI. The frontend connects every piece together: authentication, real-time SSE progress, structured itinerary display, and tool trace transparency. The combination of Vite's fast development experience, Redux Toolkit's predictable state management, and SSE's real-time updates creates a smooth, responsive planning experience.*
