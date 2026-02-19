# Phase 2: Auth Frontend + Token Refresh - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Wire the React app to the Phase 1 auth backend: fetch the user's role from `/api/auth/me`, store it in `AuthContext`, guard `/dashboard/admin` routes client-side, and silently refresh access tokens before they expire. Creating new auth flows, registration changes, or profile editing are separate phases.

</domain>

<decisions>
## Implementation Decisions

### Role loading UX
- After login, redirect to dashboard immediately — don't wait for `/auth/me`
- Role-dependent UI (admin nav item, etc.) uses skeleton placeholders while `/auth/me` is in flight
- If `/auth/me` fails: retry silently (1–2 attempts), then log the user out
- Role is always present on every user — no null/missing role state to handle

### Claude's Discretion: auth init
- Whether to block app render during initial auth check (reading token from storage on app start) — Claude picks the cleanest approach for TanStack Router
- Whether to call `/auth/me` on every app load vs. only on login — Claude decides what works cleanly with the persistence approach chosen

### Admin route protection
- Non-admin hitting `/dashboard/admin` → redirect to `/dashboard`
- Unauthenticated user hitting `/dashboard/admin` → redirect to `/login`
- Admin nav item: **hidden completely** for non-admin users (not disabled/grayed out)

### Claude's Discretion: redirect UX
- Whether to show a toast/message explaining why the user was redirected from admin — Claude picks what feels natural for the existing app

### Token refresh
- **Timer-based proactive refresh** — background timer fires before token expiry; refresh happens even when user is idle
- On refresh failure (expired refresh token, network error): show an error message (e.g. "Your session expired") with a "Log in again" button — do not silently log out
- **Multi-tab sync**: when one tab refreshes the token, other tabs must pick up the new token (use BroadcastChannel or storage events)

### Claude's Discretion: refresh timing
- Exact window before expiry to trigger refresh — Claude picks based on JWT TTL in the existing backend config

### Auth persistence
- Access token stored in **localStorage** — survives page refresh, tab close, browser restart
- **Persistent sessions**: user stays logged in after closing and reopening the browser (until token expires or they log out)
- On page reload: always call `/auth/me` to restore role — do not decode role from JWT payload client-side

### Claude's Discretion: refresh token storage
- Where to store the refresh token (localStorage vs. HttpOnly cookie) — Claude picks based on what the existing backend already sets or what's cleanest to add securely

</decisions>

<specifics>
## Specific Ideas

- Role is sourced from `/api/auth/me` response (Phase 1 already returns `role` in the response)
- Tab sync for token refresh should not require a server round-trip from non-refreshing tabs — just read the updated token from storage

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 02-auth-frontend-token-refresh*
*Context gathered: 2026-02-19*
