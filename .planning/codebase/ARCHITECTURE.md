# Architecture

**Analysis Date:** 2026-02-18

## Pattern Overview

**Overall:** React SPA with file-based routing and client-side state management

**Key Characteristics:**
- TanStack Router for file-based routing with automatic code splitting
- TanStack React Query for server state management with 5-minute stale time
- TanStack DB (local-only collections) for client-side data storage
- Context API for authentication state
- TailwindCSS v4 for styling
- Vite for build and dev server with hot module replacement

## Layers

**Presentation (UI Components):**
- Purpose: Render UI and handle user interactions
- Location: `src/components/` and `src/components/dashboard/`
- Contains: React functional components with hooks
- Depends on: `src/hooks/`, `src/types.ts`, utility functions
- Used by: Route components in `src/routes/`
- Patterns: Component-based with prop drilling and context consumption

**Routing Layer:**
- Purpose: Handle navigation and route-based code splitting
- Location: `src/routes/`
- Contains: File-based route definitions using TanStack Router
- Depends on: Presentation components, hooks, data layer
- Used by: Application entry point
- Patterns: TanStack Router file convention (`__root.tsx`, `index.tsx`, nested folders for child routes)

**State Management:**
- Authentication: Context API in `src/hooks/AuthContext.tsx`
  - Manages user, tokens, loading state
  - Persists to localStorage
  - Handles token refresh and expiration checking
- Server State: TanStack React Query (configured in `src/queryClient.ts`)
  - 5 minute stale time, 3 retries default
  - Used for API calls
- Client Cache: TanStack DB in `src/db.ts`
  - Local-only collections for dashboard data
  - Collections: dashboardSummary, usageTrends, fileTypeData, errorLogs, geographicData, userProfile, apiKeys, detailedAnalytics
  - useLiveQuery hook for reactive subscriptions

**Data/API Layer:**
- Purpose: Handle all HTTP communication and data operations
- Location: `src/api.ts` (auth and API keys), `src/db.ts` (collections), `src/data/dashboardMocks.ts` (mock data)
- Contains: Fetch-based API functions with auth headers
- Depends on: `src/types.ts` for type safety
- Used by: Route components and hooks
- Patterns: Module-based API objects (authApi, apiKeysApi)

**Domain Logic:**
- Purpose: Business logic and utilities
- Location: `src/utils/apiKey.ts`, `src/constants.ts`
- Contains: Pure functions, constants, helpers
- Depends on: Types only
- Used by: Components and routes

## Data Flow

**User Login/Authentication:**
1. User navigates to `/login`
2. OAuth callback at `/auth/callback` receives tokens and user data
3. `AuthContext.login()` stores tokens/user in localStorage and updates context
4. Navbar reflects authenticated state
5. Dashboard routes check `useAuth()` hook and redirect if not authenticated

**Dashboard Data Loading:**
1. `DashboardComponent` in `/dashboard` route mounts
2. `useEffect` triggers `dbHelpers.initializeWithMockData()` on app startup
3. Collections are populated with mock data from `src/data/dashboardMocks.ts`
4. Components use `useLiveQuery()` to subscribe to collection updates
5. Changes to collections automatically trigger re-renders

**API Key Management:**
1. User navigates to `/dashboard/settings`
2. `useEffect` triggers `dbHelpers.syncApiKeys(token)`
3. `apiKeysApi.getApiKeys()` calls `/api/api-key` with Bearer token
4. Response stored in `collections.apiKeys`
5. `useLiveQuery` provides live reactive updates to UI
6. User can generate or revoke keys via API calls

**State Management:**
- Authentication state: localStorage (persistent) + AuthContext (runtime)
- Server state: TanStack Query with cache invalidation
- Client cache: TanStack DB collections with live queries
- UI state: React component state (loading, error messages)

## Key Abstractions

**AuthContext (Authentication):**
- Purpose: Centralized authentication state and operations
- Files: `src/hooks/AuthContext.tsx`
- Pattern: React Context Provider with useAuth hook
- Exposes: login(), logout(), refreshToken(), isAuthenticated, user, tokens, isLoading
- Initialization: Loads from localStorage on mount, validates token expiration

**Database Collections (Data Access):**
- Purpose: Reactive client-side data storage
- Files: `src/db.ts`
- Pattern: TanStack DB local-only collections with helper methods
- Exports: `collections` object, `dbHelpers` with initializeWithMockData() and syncApiKeys()
- Reactivity: useLiveQuery hook for automatic subscriptions

**API Modules (HTTP Communication):**
- Purpose: Encapsulate API calls with consistent headers and error handling
- Files: `src/api.ts`
- Pattern: Object with async methods for each endpoint
- Exports: authApi (refresh, logout), apiKeysApi (getApiKeys, createApiKey, revokeApiKey)
- Auth: Bearer token or x-api-key header depending on context

**Router Context (Route-level State):**
- Purpose: Pass authentication state to all routes
- Files: `src/router.tsx`
- Pattern: RouterContext with auth status
- Used by: Dashboard and protected routes for access control

## Entry Points

**Application Bootstrap:**
- Location: `src/main.tsx`
- Triggers: Application startup
- Responsibilities:
  - Mount React to DOM
  - Initialize database with mock data
  - Wrap app in QueryClientProvider and RouterProvider
  - Attach Router DevTools in development

**Root Layout:**
- Location: `src/routes/__root.tsx`
- Triggers: Every route render
- Responsibilities:
  - Wrap with AuthProvider
  - Render Navbar with theme toggle
  - Render theme-aware Footer
  - Outlet for child routes

**Landing Page:**
- Location: `src/routes/index.tsx` renders `src/App.tsx`
- Triggers: Navigation to /
- Responsibilities: Display Hero, Features, Pricing, Overage Pricing, CTA sections

**Dashboard (Protected):**
- Location: `src/routes/dashboard.tsx`
- Triggers: Navigation to /dashboard
- Responsibilities:
  - Check authentication status via useAuth()
  - Redirect to /login if not authenticated
  - Show loading state during auth check
  - Render DashboardLayout with nested routes

**Dashboard Sub-routes:**
- `/dashboard/overview` - Analytics and metrics
- `/dashboard/settings` - API keys and profile management
- `/dashboard/analytics` - Detailed analytics

## Error Handling

**Strategy:** Try-catch blocks with console logging and UI fallback states

**Patterns:**
- API calls: Wrap fetch in try-catch, return error to caller
- Auth: Clear corrupted localStorage on parse errors, set isLoading: false
- DB sync: Log warnings but don't throw on duplicate key errors
- Routes: Display error message to user if data fails to load, use skeleton loaders while loading

**Token Expiration:** AuthContext checks token.expiresAt with 60 second buffer, clears if expired on mount

**API Timeout:** apiKeysApi.getApiKeys() uses 2-second timeout with AbortController

## Cross-Cutting Concerns

**Logging:**
- Console methods (console.log, console.error, console.warn)
- Errors logged in try-catch blocks, auth operations, DB sync failures

**Validation:**
- TypeScript strict mode for compile-time safety
- Type guards in route protection (useAuth() hook)
- Runtime validation of auth state in useEffect

**Authentication:**
- OAuth flow via /auth/callback route
- Bearer token in Authorization header for authenticated endpoints
- Fallback to x-api-key in development mode for testing
- Token refresh on demand via refreshToken() in AuthContext
- localStorage persistence with expiration check

**Theming:**
- Dark mode toggle via useTheme hook
- Stored in localStorage
- Applied to document.documentElement.classList
- Tailwind dark: prefix for dark mode styles

---

*Architecture analysis: 2026-02-18*
