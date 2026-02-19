# Phase 2: Auth Frontend + Token Refresh - Research

**Researched:** 2026-02-19
**Domain:** React auth state management, TanStack Router guards, JWT token refresh lifecycle
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Role loading UX
- After login, redirect to dashboard immediately — don't wait for `/auth/me`
- Role-dependent UI (admin nav item, etc.) uses skeleton placeholders while `/auth/me` is in flight
- If `/auth/me` fails: retry silently (1–2 attempts), then log the user out
- Role is always present on every user — no null/missing role state to handle

#### Admin route protection
- Non-admin hitting `/dashboard/admin` → redirect to `/dashboard`
- Unauthenticated user hitting `/dashboard/admin` → redirect to `/login`
- Admin nav item: **hidden completely** for non-admin users (not disabled/grayed out)

#### Token refresh
- **Timer-based proactive refresh** — background timer fires before token expiry; refresh happens even when user is idle
- On refresh failure (expired refresh token, network error): show an error message (e.g. "Your session expired") with a "Log in again" button — do not silently log out
- **Multi-tab sync**: when one tab refreshes the token, other tabs must pick up the new token (use BroadcastChannel or storage events)

#### Auth persistence
- Access token stored in **localStorage** — survives page refresh, tab close, browser restart
- **Persistent sessions**: user stays logged in after closing and reopening the browser (until token expires or they log out)
- On page reload: always call `/auth/me` to restore role — do not decode role from JWT payload client-side

### Claude's Discretion

#### Auth init
- Whether to block app render during initial auth check (reading token from storage on app start) — Claude picks the cleanest approach for TanStack Router
- Whether to call `/auth/me` on every app load vs. only on login — Claude decides what works cleanly with the persistence approach chosen

#### Redirect UX
- Whether to show a toast/message explaining why the user was redirected from admin — Claude picks what feels natural for the existing app

#### Refresh timing
- Exact window before expiry to trigger refresh — Claude picks based on JWT TTL in the existing backend config

#### Refresh token storage
- Where to store the refresh token (localStorage vs. HttpOnly cookie) — Claude picks based on what the existing backend already sets or what's cleanest to add securely

### Deferred Ideas (OUT OF SCOPE)

None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-04 | Frontend fetches role from `/api/auth/me` after login and stores in AuthContext | `/auth/me` returns `{ id, email, roles: UserRole[], displayName: null }` — `User` type needs `roles` field added; `AuthContext` needs role-aware state + `fetchMe()` call |
| AUTH-05 | Admin sidebar section and `/dashboard/admin` route only visible/accessible to admins (TanStack Router `beforeLoad` guard) | TanStack Router pathless layout routes (`_admin/route.tsx`) with `beforeLoad` checking `context.auth.user?.roles` enable this without duplicating guard logic |
| AUTH-06 | Access token auto-refreshes before expiration (not just on-demand) | Timer-based proactive refresh using `setTimeout` scheduled at `(expiresAt - now - 5min)` with `window.addEventListener('storage', ...)` for multi-tab sync |
</phase_requirements>

## Summary

Phase 2 wires the React frontend to the Phase 1 auth backend. The work touches three tightly coupled areas: (1) extending `AuthContext` to store and fetch the user's role from `/api/auth/me`, (2) adding a TanStack Router `beforeLoad` guard on a new `_admin` pathless layout route group that enforces role-based access to `/dashboard/admin`, and (3) upgrading the existing stub `refreshToken()` function in `AuthContext` to a proactive timer-driven mechanism with multi-tab sync.

The existing codebase has a partial auth implementation: `AuthContext.tsx` already stores `user`, `tokens`, `isAuthenticated`, and `isLoading` in state, and has a `refreshToken()` stub that calls `/api/auth/refresh`. The `User` type in `types.ts` lacks a `roles` field. The `dashboard.tsx` route uses a `useEffect`-based auth check — this is an anti-pattern compared to TanStack Router's `beforeLoad` approach. The router has a `context` object defined in `router.tsx` but it is not connected to `AuthProvider` state. These gaps are the primary work of this phase.

JWT TTL is configured as `JWT_EXPIRES_IN=1h` and `JWT_REFRESH_EXPIRES_IN=7d` in the backend `.env`. The backend currently sends the refresh token in the redirect URL as a query parameter (`refreshToken=...`), storing it in localStorage in the callback handler. The backend has `credentials: true` in CORS but no `cookie-parser` installed. Switching to HttpOnly cookies for the refresh token would require backend changes (cookie-parser, `res.cookie()` in the auth controller, `credentials: 'include'` in all fetch calls) — significant scope. Keeping the refresh token in localStorage for this phase is the pragmatic choice given the existing architecture.

**Primary recommendation:** Extend `AuthContext` with a `role` field sourced from `/api/auth/me` (called on every app load and after login), wire router context to `AuthProvider` state using the `router.invalidate()` pattern, add a `_admin` pathless route group with a `beforeLoad` role check, and replace the stub refresh logic with a `setTimeout`-based proactive refresh + `storage` event listener for cross-tab sync.

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@tanstack/react-router` | ^1.132.25 (already installed) | File-based routing, `beforeLoad` guards, router context | The app already uses it; pathless layout routes are its canonical auth pattern |
| React Context API | Built-in (React 19) | Auth state store (`AuthContext`) | Already in use; no additional install needed |
| Web `BroadcastChannel` / `storage` event | Browser native | Multi-tab token sync | Both are native APIs; `storage` event is the fallback; both are zero-dependency |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `fetch` (native) | Browser native | `/auth/me` and `/auth/refresh` calls | Already used in `api.ts`; no Axios needed |
| `setTimeout` / `clearTimeout` | Browser native | Proactive refresh timer | Simpler than `setInterval`; re-schedules after each successful refresh |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `storage` event for tab sync | `BroadcastChannel` | BroadcastChannel is cleaner (dedicated channel, no key filtering needed) but has a known Safari/iOS limitation that makes `storage` events the safer fallback. Since the context says "use BroadcastChannel or storage events", use `storage` events as primary — they're universally supported, fire when localStorage changes from another tab, and fulfill the requirement that non-refreshing tabs just read the updated token from storage |
| `setTimeout` for refresh timer | `setInterval` | `setInterval` accumulates drift; `setTimeout` rescheduled after each refresh stays accurate |
| Custom retry logic for `/auth/me` | `fetch-retry` npm package | The requirement is 1–2 silent retries; a simple `for` loop with `try/catch` is sufficient; no dependency needed |

**Installation:** No new packages required. All APIs are browser-native or already installed.

## Architecture Patterns

### Recommended Project Structure

```
src/
├── types.ts                        # Add `roles: string[]` to User interface
├── api.ts                          # Add `authApi.me(token)` function
├── hooks/
│   └── AuthContext.tsx             # Extend with role, fetchMe, proactive refresh timer
├── router.tsx                      # Wire AuthProvider state to RouterProvider context
├── main.tsx                        # Wrap RouterProvider with AuthProvider (already done)
├── routes/
│   ├── __root.tsx                  # Already wraps with AuthProvider
│   ├── dashboard.tsx               # Keep existing; beforeLoad guard added via _admin group
│   └── dashboard/
│       └── _admin/                 # New pathless layout directory
│           ├── route.tsx           # beforeLoad: check roles, redirect if not admin
│           └── index.tsx           # /dashboard/admin landing page
└── components/
    └── dashboard/
        └── DashboardSidebar.tsx    # Conditionally render admin nav item based on role
```

### Pattern 1: Extending AuthContext with Role

**What:** Add `role` to `AuthState`/`User`, add `fetchMe()` to `AuthContextType`, call it on mount (always, for role restoration from page reload) and after login (already navigates to dashboard immediately — `fetchMe` can fire async without blocking).

**When to use:** Every app load after token is found in localStorage, and after successful OAuth callback.

**Key design choice (Claude's Discretion — auth init):** Do NOT block app render. The existing `isLoading: true` initial state already prevents the dashboard from rendering content before auth settles. `fetchMe()` runs async after the token is read from storage. During the `/auth/me` flight, `isLoading` stays `true` for role-dependent components but the access token is already usable. This is the cleanest approach for TanStack Router because `beforeLoad` on `_admin/route.tsx` reads from `context.auth` which is populated once `isLoading` is false.

**Key design choice (Claude's Discretion — when to call `/auth/me`):** Call `/auth/me` on every app load (page refresh), not just on login. The user decision requires it: "On page reload: always call `/auth/me` to restore role." On fresh login via OAuth callback, the role is also needed immediately to know if the admin nav item should appear — so `fetchMe()` fires after `login()` is called in `callback.tsx`.

```typescript
// Source: codebase analysis of AuthContext.tsx + auth.controller.ts response shape
// Extend User type in types.ts
export interface User {
  id: string;
  email: string;
  name: string;          // fallback for displayName (Phase 1 decision: displayName: null)
  picture?: string;
  roles: string[];       // ADD: sourced from /auth/me, never null (backend ensures role always present)
  createdAt: string;
  updatedAt: string;
}

// Extend AuthState in types.ts
export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;        // true while /auth/me is in flight on page load
  isRoleLoading: boolean;    // true while /auth/me is in flight after login (tokens exist but role not yet fetched)
}
```

**Note on `isLoading` vs `isRoleLoading`:** The existing `isLoading` covers the initial auth check on mount. After login (callback.tsx calls `login()` then navigates to dashboard), the user is `isAuthenticated` but the role fetch is still in flight. A separate `isRoleLoading` flag lets role-dependent components (admin nav item) show skeletons while the rest of the dashboard renders normally.

### Pattern 2: Wiring Router Context to AuthProvider

**What:** The router has a `context` object (`router.tsx`) but it is not currently populated with live auth state. TanStack Router's `beforeLoad` function receives `context.auth` — this only works if the context is passed to `<RouterProvider context={{ auth }} />`.

**When to use:** Required for `beforeLoad` guards on the `_admin` route to see the authenticated user's role.

```typescript
// Source: https://spin.atomicobject.com/authenticated-routes-tanstack-router/
// router.tsx — extend RouterContext type
interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    isLoading: boolean;
    user: User | null;
  } | undefined;
}

// main.tsx or __root.tsx — wrap RouterProvider with auth context
function AuthedRouterProvider() {
  const auth = useAuth();

  useEffect(() => {
    router.invalidate();
  }, [auth.isAuthenticated, auth.user?.roles]);

  return <RouterProvider router={router} context={{ auth }} />;
}
```

**Critical:** `router.invalidate()` must be called whenever `auth` changes so that `beforeLoad` re-evaluates. Without this, a user who logs in won't have `context.auth` updated in the router's awareness.

**Current state:** `__root.tsx` renders `<AuthProvider>` and `<RouterProvider>` is in `main.tsx` outside of `AuthProvider`. The wiring needs: `AuthProvider` wrapping a component that reads `useAuth()` and passes it into `RouterProvider context`. The cleanest change is to move `RouterProvider` rendering inside a component that can call `useAuth()`.

### Pattern 3: Pathless Layout Route for Admin Guard

**What:** Create `src/routes/dashboard/_admin/route.tsx` — TanStack Router treats the `_` prefix as "pathless" (not in URL). This file's `beforeLoad` runs before any route under `/dashboard/_admin/...` renders.

**When to use:** Whenever multiple routes share an access-control requirement (here: admin-only).

**File naming (verified):** The underscore prefix on a directory name creates a pathless layout route group. The `route.tsx` file inside the directory is the layout file with the guard. Child files (`index.tsx`, etc.) become actual routes without the `_admin` segment in their URL.

```
src/routes/dashboard/_admin/route.tsx    → ID: /dashboard/_admin (pathless)
src/routes/dashboard/_admin/index.tsx   → URL: /dashboard/admin
```

**Note:** The route ID in `createFileRoute` must match: `createFileRoute('/dashboard/_admin')`.

```typescript
// Source: https://deepwiki.com/tanstack/router/9.4-authentication-and-protected-routes
// src/routes/dashboard/_admin/route.tsx
import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/_admin')({
  beforeLoad: ({ context }) => {
    const auth = context.auth;

    // Unauthenticated → login
    if (!auth?.isAuthenticated) {
      throw redirect({ to: '/login' });
    }

    // Authenticated but not admin → dashboard
    if (!auth.user?.roles?.includes('ADMIN')) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: () => <Outlet />,
});
```

**Claude's Discretion — redirect UX:** Do NOT show a toast for admin redirect. The existing app has no toast system in place. A silent redirect to `/dashboard` is clean and consistent with the rest of the app's navigation behavior. The dashboard landing (overview) gives the user a clear landing context without needing an explanation.

### Pattern 4: Proactive Token Refresh Timer

**What:** Schedule a `setTimeout` to fire 5 minutes before the access token expires. On fire: call `/api/auth/refresh`, update tokens in localStorage and state. Reschedule the timer with the new `expiresAt`. On failure: show a session-expired UI (not a silent logout).

**When to use:** Set up after any successful auth (login or page reload with valid token). Clear and reschedule after each successful refresh.

**Refresh timing (Claude's Discretion):** JWT TTL is `1h` (3600s). Fire refresh 5 minutes (300s) before expiry. The window: `delay = expiresAt - Date.now() - 5 * 60 * 1000`. Minimum: if `delay <= 0` (token already near/past expiry), attempt refresh immediately. 5 minutes is a practical buffer: enough time to retry on transient network errors, not so long that a 7-day refresh token is wasted on excess calls.

```typescript
// Source: codebase analysis + community pattern for proactive JWT refresh
// Inside AuthContext.tsx

// Schedule timer after login or page-load auth restore
const scheduleRefresh = useCallback((expiresAt: number) => {
  const delay = expiresAt - Date.now() - 5 * 60 * 1000; // 5min buffer
  const actualDelay = Math.max(delay, 0);

  refreshTimerRef.current = setTimeout(async () => {
    try {
      await refreshToken(); // existing function, already updates localStorage + state
      // reschedule handled inside refreshToken via its own setAuthState call
      // OR: refreshToken returns new expiresAt and we call scheduleRefresh(newExpiresAt)
    } catch {
      // Per user decision: show error, do NOT silent logout
      setSessionExpired(true);
    }
  }, actualDelay);
}, [refreshToken]);

// Cleanup timer on logout/unmount
useEffect(() => {
  return () => {
    if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
  };
}, []);
```

**Note:** `refreshTimerRef` must be a `useRef<ReturnType<typeof setTimeout> | null>(null)` — not state — to avoid re-renders on timer ID changes.

### Pattern 5: Multi-Tab Sync via storage Event

**What:** When one tab refreshes the token and writes to localStorage, other tabs receive a `storage` event (fired for changes from OTHER tabs only). The listener reads the updated token and updates React state.

**When to use:** Required per user decision. Ensures idle tabs pick up new tokens without a server round-trip.

**Why `storage` event over `BroadcastChannel`:** The user decision says "BroadcastChannel or storage events." The `storage` event fires automatically when localStorage changes from another tab — it perfectly matches the requirement "non-refreshing tabs just read the updated token from storage." BroadcastChannel requires explicit `postMessage` calls and has historically had Safari/iOS issues (though MDN now marks it as "Baseline Widely available" since March 2022). Given the existing localStorage-based token storage and the requirement's phrasing, `storage` event is the simpler, safer choice.

```typescript
// Source: community pattern (Jan 2026 Medium article + codebase analysis)
// Inside AuthContext.tsx useEffect on mount

useEffect(() => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== TOKEN_STORAGE_KEY) return;

    if (!event.newValue) {
      // Token was cleared in another tab (logout)
      setAuthState({ user: null, tokens: null, isAuthenticated: false, isLoading: false });
      return;
    }

    try {
      const newTokens: AuthTokens = JSON.parse(event.newValue);
      setAuthState(prev => ({
        ...prev,
        tokens: newTokens,
      }));
      // Reschedule the refresh timer with the new expiresAt
      scheduleRefresh(newTokens.expiresAt);
    } catch {
      // Corrupted storage — ignore
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [scheduleRefresh]);
```

### Anti-Patterns to Avoid

- **`useEffect` redirect in route components:** The existing `dashboard.tsx` uses `useEffect` + `navigate()` for auth checking. This is the old pattern — `beforeLoad` in TanStack Router prevents the component from mounting at all, which is correct. Do not replicate the `useEffect` pattern for the admin route. Leave the existing `dashboard.tsx` guard in place (it handles the unauthenticated → `/login` redirect for the dashboard root); add `beforeLoad` only in the new `_admin/route.tsx`.

- **Decoding role from JWT payload client-side:** The user decision explicitly forbids this. Always use `/auth/me` response for role. JWT payloads are base64-encoded and readable by JavaScript but the phase specifically requires the server-authoritative role from the API.

- **Silent logout on refresh failure:** Per user decision, show a session-expired UI with "Log in again" button. Do NOT call `logout()` silently.

- **Blocking app render on auth init:** Do NOT use a `<Suspense>` or full-screen loader that prevents the entire app from rendering while `/auth/me` is in flight. The `isLoading` flag on route components handles this granularly. The app shell (Navbar, Footer) should render immediately.

- **`setInterval` for refresh timer:** Use `setTimeout` rescheduled after each refresh to avoid timer drift. `setInterval` with 1h will fire at fixed intervals regardless of when the token was actually issued.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Route auth guard | Custom middleware/HOC pattern | TanStack Router `beforeLoad` in pathless layout route | `beforeLoad` runs before component mount, integrates with router context, handles TypeScript inference correctly; HOCs cause re-render flicker |
| Cross-tab token sync | Custom polling or WebSocket | Native `storage` event listener | `storage` event fires synchronously in other tabs; zero polling overhead; built into the browser |
| Retry logic for `/auth/me` | Third-party retry library | Simple `for` loop with `try/catch` | Only 1–2 retries needed; adding `fetch-retry` or `axios-retry` is over-engineering for this case |
| Skeleton UI | Custom shimmer CSS | Tailwind `animate-pulse` on placeholder divs | The existing app uses Tailwind throughout; `animate-pulse` on a shaped div produces a standard skeleton with zero new dependencies |

**Key insight:** TanStack Router's `beforeLoad` is specifically designed to block navigation until auth is verified. Using component-level `useEffect` for route guards bypasses this mechanism and causes flash-of-unauthorized-content.

## Common Pitfalls

### Pitfall 1: Router context not updating after auth state changes

**What goes wrong:** User logs in, `AuthContext` updates, but `beforeLoad` on the next navigation still sees `auth: undefined` or the old state.

**Why it happens:** TanStack Router caches route context between navigations. Changing React state in `AuthProvider` does not automatically invalidate the router's cached context.

**How to avoid:** Call `router.invalidate()` inside a `useEffect` that watches `isAuthenticated` and `user.roles`. This forces all `beforeLoad` hooks to re-execute with the fresh context.

**Warning signs:** Admin route is accessible right after login without redirect, or redirect happens on the second navigation instead of the first.

### Pitfall 2: `storage` event fires in the SAME tab

**What goes wrong:** A tab writes a new token to localStorage and immediately receives its own `storage` event, triggering a redundant state update and double refresh timer schedule.

**Why it happens:** `storage` events only fire in OTHER tabs (same origin), not the tab that wrote the value. This is actually the correct behavior — but developers sometimes test with a single tab and wonder why the listener never fires.

**How to avoid:** Understand that `storage` events are intentionally cross-tab only. The writing tab updates state directly via `setAuthState`. No additional handling needed.

**Warning signs:** During development, opening a single tab and refreshing the token appears to work but cross-tab sync is never triggered — verify with two tabs open.

### Pitfall 3: Timer not cleared on logout or unmount

**What goes wrong:** User logs out but the refresh timer fires 5 minutes later, making an API call with an invalidated token, potentially causing confusing errors.

**Why it happens:** `setTimeout` is not automatically cancelled when React state changes or components unmount.

**How to avoid:** Store the timer ID in a `useRef`. Call `clearTimeout(refreshTimerRef.current)` at the start of `logout()` and in the `useEffect` cleanup function.

**Warning signs:** Console shows a 401 error on `/api/auth/refresh` several minutes after logout.

### Pitfall 4: `_admin` directory name conflict with TanStack Router route ID

**What goes wrong:** Route generation fails or produces duplicate IDs like `/dashboard/_admin/_admin`.

**Why it happens:** TanStack Router's file-based router codegen uses the directory name as part of the route ID. The `_` prefix marks it as pathless. The `route.tsx` file inside the directory IS the layout route — it does not add another path segment.

**How to avoid:** Use `createFileRoute('/dashboard/_admin')` in `_admin/route.tsx`. Use `createFileRoute('/dashboard/_admin/')` (with trailing slash or as `/dashboard/admin`) in `_admin/index.tsx`. After adding the files, run the vite dev server — the router codegen (`@tanstack/router-vite-plugin`) will regenerate `routeTree.gen.ts`. Verify the generated file shows the correct route IDs.

**Warning signs:** TypeScript errors in `routeTree.gen.ts` showing duplicate IDs, or `createFileRoute` showing a type error for the path string.

### Pitfall 5: `isLoading` blocks the admin nav item skeleton forever

**What goes wrong:** The admin nav item shows a skeleton placeholder but never resolves because `isRoleLoading` (or whatever flag drives it) is never set to `false`.

**Why it happens:** If `/auth/me` is called but its response path doesn't update `isRoleLoading` correctly (e.g., the catch block doesn't reset it), the skeleton stays permanently.

**How to avoid:** Use `try/finally` in `fetchMe()` to ensure `isRoleLoading` is always set to `false` regardless of success or failure.

**Warning signs:** Skeleton shimmer in the sidebar never resolves, even after a successful login.

### Pitfall 6: Refresh token in localStorage — current state vs. ideal

**What goes wrong:** The refresh token is stored in localStorage (written in `callback.tsx`). This is what the existing backend currently sends. Switching to HttpOnly cookies requires: installing `cookie-parser` in NestJS, changing `auth.controller.ts` to `res.cookie()` instead of query param redirect, and `credentials: 'include'` on all fetch calls.

**Why it matters:** The user decision defers this to Claude's Discretion. The correct recommendation: keep refresh token in localStorage for this phase. The backend has no cookie infrastructure (`cookie-parser` is not installed, the Google OAuth callback redirect puts tokens in query params). Adding HttpOnly cookie support is a meaningful backend change that would need its own plan. The refresh token's risk surface with localStorage is mitigated by the 7-day TTL and the server-side invalidation on refresh (backend sets `refreshToken: null` in DB after each use — rotation is already implemented).

**How to handle:** Document the localStorage approach as a known security trade-off. Do not add HttpOnly cookie support in this phase.

## Code Examples

Verified patterns from codebase analysis and official sources:

### Extending User type with roles

```typescript
// Source: codebase analysis of src/types.ts + pdfthumbnailpro-be/src/auth/auth.controller.ts getMe() response
// File: src/types.ts

export interface User {
  id: string;
  email: string;
  name: string;          // used as display name fallback (displayName is null from backend)
  picture?: string;
  roles: string[];       // NEW: ['user'] or ['admin'] — always present, never empty
  createdAt: string;
  updatedAt: string;
}

export interface AuthState {
  user: User | null;
  tokens: AuthTokens | null;
  isAuthenticated: boolean;
  isLoading: boolean;        // true on initial app load while /auth/me is in flight
  isRoleLoading: boolean;    // NEW: true after login while /auth/me is in flight (dashboard renders but admin nav shows skeleton)
}
```

### Adding `authApi.me()` to api.ts

```typescript
// Source: codebase analysis of src/api.ts + backend GET /auth/me response shape
export const authApi = {
  async me(accessToken: string) {
    const response = await fetch('/api/auth/me', {
      headers: { Authorization: `Bearer ${accessToken}` },
    });
    if (!response.ok) throw new Error('Failed to fetch user profile');
    return response.json() as Promise<{ id: string; email: string; roles: string[]; displayName: string | null }>;
  },

  // existing refresh() and logout() unchanged
};
```

### fetchMe with retry in AuthContext

```typescript
// Source: codebase analysis + user constraint (1-2 silent retries then logout)
const fetchMe = useCallback(async (accessToken: string): Promise<void> => {
  setAuthState(prev => ({ ...prev, isRoleLoading: true }));

  let lastError: Error | null = null;
  for (let attempt = 0; attempt < 2; attempt++) {
    try {
      const profile = await authApi.me(accessToken);
      setAuthState(prev => ({
        ...prev,
        isRoleLoading: false,
        user: prev.user
          ? { ...prev.user, roles: profile.roles }
          : null,
      }));
      return;
    } catch (err) {
      lastError = err as Error;
      if (attempt < 1) await new Promise(r => setTimeout(r, 1000)); // 1s between retries
    }
  }

  // All retries failed → logout
  console.error('fetchMe failed after retries:', lastError);
  await logout();
}, [logout]);
```

### Wiring RouterProvider with auth context

```typescript
// Source: https://spin.atomicobject.com/authenticated-routes-tanstack-router/
// File: src/main.tsx (or wrap in a new component in main.tsx)

function AuthedApp() {
  const auth = useAuth();

  useEffect(() => {
    router.invalidate();
  }, [auth.isAuthenticated, auth.user?.roles]);

  return (
    <>
      <RouterProvider router={router} context={{ auth }} />
      {import.meta.env.DEV && <TanStackRouterDevtools router={router} />}
    </>
  );
}

// Update root render to wrap with AuthProvider:
root.render(
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <AuthedApp />
    </AuthProvider>
  </QueryClientProvider>
);
```

**Note:** This changes the existing structure where `AuthProvider` is inside `__root.tsx`. Move `AuthProvider` to `main.tsx` so it wraps `RouterProvider`. Update `__root.tsx` to remove `AuthProvider` wrapper.

### Pathless admin route guard

```typescript
// Source: https://deepwiki.com/tanstack/router/9.4-authentication-and-protected-routes
// File: src/routes/dashboard/_admin/route.tsx

import { createFileRoute, redirect, Outlet } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/_admin')({
  beforeLoad: ({ context }) => {
    if (!context.auth?.isAuthenticated) {
      throw redirect({ to: '/login' });
    }
    if (!context.auth.user?.roles?.includes('ADMIN')) {
      throw redirect({ to: '/dashboard' });
    }
  },
  component: () => <Outlet />,
});
```

### Proactive refresh timer

```typescript
// Source: codebase analysis + community pattern
// Inside AuthContext.tsx

const refreshTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
const [sessionExpired, setSessionExpired] = useState(false);

const scheduleRefresh = useCallback((expiresAt: number) => {
  if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);

  const BUFFER_MS = 5 * 60 * 1000; // 5 minutes before expiry
  const delay = Math.max(expiresAt - Date.now() - BUFFER_MS, 0);

  refreshTimerRef.current = setTimeout(async () => {
    try {
      await doRefresh(); // calls /api/auth/refresh, updates localStorage + state
    } catch {
      setSessionExpired(true); // Show "Your session expired" UI
    }
  }, delay);
}, [doRefresh]);
```

### Multi-tab sync via storage event

```typescript
// Source: codebase analysis + community pattern (Jan 2026)
// Inside AuthContext.tsx useEffect

useEffect(() => {
  const handleStorageChange = (event: StorageEvent) => {
    if (event.key !== TOKEN_STORAGE_KEY) return;

    if (!event.newValue) {
      // Another tab logged out
      setAuthState({ user: null, tokens: null, isAuthenticated: false, isLoading: false, isRoleLoading: false });
      if (refreshTimerRef.current) clearTimeout(refreshTimerRef.current);
      return;
    }

    try {
      const newTokens: AuthTokens = JSON.parse(event.newValue);
      setAuthState(prev => ({ ...prev, tokens: newTokens }));
      scheduleRefresh(newTokens.expiresAt);
    } catch {
      // Corrupted storage entry, ignore
    }
  };

  window.addEventListener('storage', handleStorageChange);
  return () => window.removeEventListener('storage', handleStorageChange);
}, [scheduleRefresh]);
```

### Skeleton for admin nav item

```typescript
// Source: codebase analysis of DashboardSidebar.tsx
// Tailwind animate-pulse skeleton — no additional package needed

// In DashboardSidebar.tsx
const { user, isRoleLoading } = useAuth();
const isAdmin = user?.roles?.includes('ADMIN') ?? false;

// In nav render:
{isRoleLoading ? (
  // Skeleton placeholder — same dimensions as the nav item
  <div className="h-10 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse" />
) : isAdmin ? (
  <Link to="/dashboard/admin" className={...}>
    <span className="mr-3">🔧</span>
    Admin
  </Link>
) : null}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `useEffect` + `navigate()` for route auth | `beforeLoad` throwing `redirect()` in pathless layout route | TanStack Router v1 | No flash-of-unauthorized-content; TypeScript-safe redirect; no component mount before check |
| Polling for token expiry | `setTimeout` proactive refresh | Community standard (2022+) | Accurate timing; fires even during user inactivity; no wasted requests during active periods |
| localStorage `storage` event for cross-tab | BroadcastChannel API | Chrome 54+ / Firefox 38+ / Safari 15.4 | BroadcastChannel is cleaner but `storage` event is universally reliable and requires no changes to the writer |
| Decode JWT payload client-side for role | Always fetch `/auth/me` | N/A (user decision) | Server-authoritative roles; no risk of stale claims being acted on client-side |

**Deprecated/outdated in this codebase:**
- `dashboard.tsx` `useEffect` redirect pattern: still functional but should not be replicated for the admin route. The existing pattern can stay for the dashboard root since it's already there and tested.
- Storing user data (including name, picture) in localStorage `USER_STORAGE_KEY`: the role should NOT be persisted in localStorage user object — it must always come from `/auth/me` to avoid stale role after a role change. The user object in localStorage can continue to store `name`/`picture` for display, but roles in state come from `/auth/me` response only.

## Open Questions

1. **`/dashboard/admin` route — what does it render?**
   - What we know: The phase requirements say "admin sidebar section and `/dashboard/admin` route" — route guard is required. The route file needs to exist for the guard to be testable.
   - What's unclear: Whether there's any admin-specific content planned (a placeholder "Coming soon" or a real admin panel).
   - Recommendation: Create `/dashboard/_admin/index.tsx` with a simple "Admin Panel" placeholder page. The guard logic is the deliverable; the page content is filler for now.

2. **`beforeLoad` vs component-level check — existing `dashboard.tsx`**
   - What we know: `dashboard.tsx` uses `useEffect` + `navigate()` for auth check. This is intentional and has Cypress test accommodation (`window.Cypress` bypass).
   - What's unclear: Whether the planner should refactor `dashboard.tsx` to use `beforeLoad` as part of this phase.
   - Recommendation: Leave `dashboard.tsx` as-is for this phase. Adding `beforeLoad` there would require refactoring the router context wiring which is already in scope, and would invalidate existing Playwright tests. The admin-specific guard in `_admin/route.tsx` is sufficient to fulfill AUTH-05.

3. **Session-expired UI placement**
   - What we know: On refresh failure, show "Your session expired" with "Log in again" button.
   - What's unclear: Whether this is a modal, a toast, or a full-page state.
   - Recommendation: A modal overlay or a top-banner component is cleanest. A toast is too easy to miss for something as important as session expiry. A simple conditional render in `AuthContext` consumers (or in `__root.tsx`) checking `sessionExpired` state shows a dismissible modal.

## Sources

### Primary (HIGH confidence)

- Codebase analysis: `src/hooks/AuthContext.tsx` — existing auth state structure, token storage keys, refresh stub
- Codebase analysis: `src/types.ts` — current `User`, `AuthTokens`, `AuthState` interfaces (missing `roles`)
- Codebase analysis: `src/router.tsx` — `RouterContext` interface (not wired to AuthProvider)
- Codebase analysis: `src/routes/__root.tsx` — `AuthProvider` placement, `HeadContent`
- Codebase analysis: `src/routes/dashboard.tsx` — existing useEffect auth guard pattern
- Codebase analysis: `src/routes/auth/callback.tsx` — OAuth callback, login() call, refresh token in query param
- Codebase analysis: `src/api.ts` — `authApi.refresh()` and `authApi.logout()` patterns
- Codebase analysis: `src/components/dashboard/DashboardSidebar.tsx` — nav items array, no role check
- Codebase analysis: `pdfthumbnailpro-be/src/auth/auth.controller.ts` — `/auth/me` response shape: `{ id, email, roles: UserRole[], displayName: null }`
- Codebase analysis: `pdfthumbnailpro-be/.env` — `JWT_EXPIRES_IN=1h`, `JWT_REFRESH_EXPIRES_IN=7d`
- Codebase analysis: `pdfthumbnailpro-be/src/main.ts` — `enableCors({ credentials: true })`, no `cookie-parser`
- Codebase analysis: `pdfthumbnailpro-be/src/auth/auth.service.ts` — refresh token rotation (sets to null after use), single-use refresh tokens
- TanStack Router docs via WebSearch: [Authenticated Routes](https://tanstack.com/router/latest/docs/framework/react/guide/authenticated-routes) — `beforeLoad`, `redirect`, pathless layout routes
- [DeepWiki TanStack Router Auth](https://deepwiki.com/tanstack/router/9.4-authentication-and-protected-routes) — role-based `beforeLoad` example, file structure

### Secondary (MEDIUM confidence)

- [Atomic Object blog](https://spin.atomicobject.com/authenticated-routes-tanstack-router/) — `AuthedRouterProvider` with `router.invalidate()`, verified consistent with TanStack Router docs
- [Leonardo Montini blog](https://leonardomontini.dev/tanstack-router-guard/) — `throw redirect()` vs return, pathless group with `_` prefix, verified consistent with official docs
- [MDN BroadcastChannel API](https://developer.mozilla.org/en-US/docs/Web/API/Broadcast_Channel_API) — "Baseline Widely available since March 2022"; `storage` event remains more universally reliable for this use case
- [Descope JWT storage guide](https://www.descope.com/blog/post/developer-guide-jwt-storage) — localStorage XSS risk, HttpOnly cookie recommendation; contextualizes the refresh token storage trade-off
- [rabbitbyte.club NestJS HttpOnly cookie](https://rabbitbyte.club/how-to-implement-refresh-tokens-through-http-only-cookie-in-nestjs-and-react/) — confirms cookie-parser requirement and backend changes needed; reason for deferring this approach

### Tertiary (LOW confidence)

- None — all findings have at least one verified secondary source.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all patterns use already-installed dependencies or browser APIs
- Architecture: HIGH — TanStack Router pathless route pattern verified via multiple sources; `AuthContext` extension verified against existing codebase structure
- Pitfalls: HIGH — most pitfalls identified through direct codebase analysis (router context not wired, USER_STORAGE_KEY role staleness) plus verified community patterns

**Research date:** 2026-02-19
**Valid until:** 2026-03-19 (30 days — TanStack Router v1 is stable; browser APIs are stable)
