---
phase: 02-auth-frontend-token-refresh
plan: 03
subsystem: auth
tags: [react, jwt, token-refresh, localstorage, cross-tab, useCallback, useRef, setTimeout]

# Dependency graph
requires:
  - phase: 02-01
    provides: "fetchMe, isRoleLoading, AuthProvider in main.tsx, authApi.me"
  - phase: 01-01
    provides: "/api/auth/refresh endpoint, JWT auth infrastructure"
provides:
  - "scheduleRefresh(expiresAt) — proactive setTimeout firing 5 minutes before token expiry"
  - "doRefresh() — calls authApi.refresh, updates localStorage + state, reschedules timer"
  - "sessionExpired boolean in AuthContext — set on refresh failure, never silent logout"
  - "SessionExpiredModal in __root.tsx — non-dismissable overlay with 'Log in again' link"
  - "Cross-tab storage event listener — syncs token refresh and logout across tabs"
  - "Timer cleared in logout() and AuthProvider unmount"
affects: [frontend-auth-consumers, protected-routes, admin-routes]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "scheduleRefreshRef pattern: useRef holds scheduleRefresh to break circular useCallback dep between doRefresh and scheduleRefresh"
    - "Proactive refresh: setTimeout fires BUFFER_MS before expiresAt, clamped to 0ms minimum"
    - "Session-expired UI: show modal instead of silent logout on refresh failure"
    - "Cross-tab sync: storage event listener (fires only in other tabs) reads newValue to update tokens/clear state"

key-files:
  created: []
  modified:
    - src/hooks/AuthContext.tsx
    - src/routes/__root.tsx

key-decisions:
  - "scheduleRefreshRef (useRef pattern) breaks circular dependency between doRefresh and scheduleRefresh without resorting to global variables or function hoisting"
  - "refreshToken() kept as backward-compatible alias for doRefresh() — existing consumers need not change"
  - "SessionExpiredModal uses <a href=/login> (full page nav) not TanStack Router Link to clear any stale router state"
  - "Modal has no dismiss button — once session expires, re-login is the only valid action"

patterns-established:
  - "Ref-based callback forwarding: when A calls B and B calls A (circular), store one in a useRef updated via useEffect"
  - "storage events fire only in OTHER tabs — writing tab updates state directly, no dedup needed"

requirements-completed: [AUTH-06]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 2 Plan 3: Proactive Token Refresh Timer and Session-Expired Modal Summary

**Timer-driven token refresh (5 min before expiry) with cross-tab sync via storage events and a non-dismissable session-expired modal on failure**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-19T16:31:34Z
- **Completed:** 2026-02-19T16:33:27Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- `scheduleRefresh(expiresAt)` sets a `setTimeout` firing 5 minutes before token expiry (clamped to 0ms minimum), called on mount restore and after every successful refresh
- `doRefresh()` calls `authApi.refresh`, writes new tokens to localStorage, updates auth state, and reschedules the next timer cycle — refresh failure sets `sessionExpired: true` instead of silently logging out
- `storage` event listener syncs token updates from other tabs and propagates logout across all open tabs
- `SessionExpiredModal` renders a fixed overlay with accessible ARIA attributes and a "Log in again" anchor that performs full-page navigation to `/login`

## Task Commits

Each task was committed atomically:

1. **Task 1: Proactive refresh timer and cross-tab sync in AuthContext** - `6cd0cb3` (feat)
2. **Task 2: SessionExpiredModal in root component** - `fef9c66` (feat)

**Plan metadata:** _(docs commit to follow)_

## Files Created/Modified

- `src/hooks/AuthContext.tsx` — Added `scheduleRefresh`, `doRefresh`, `scheduleRefreshRef` pattern, `sessionExpired` state, storage event listener, timer cleanup effect, updated `logout` to clear timer, updated `contextValue` and `AuthContextType`
- `src/routes/__root.tsx` — Added `SessionExpiredModal` component, imported `useAuth`, reads `sessionExpired` and conditionally renders modal after `<Footer />`

## Decisions Made

- **scheduleRefreshRef pattern:** `doRefresh` and `scheduleRefresh` each reference the other — solved by storing `scheduleRefresh` in a `useRef` updated via `useEffect`, so `doRefresh` can call `scheduleRefreshRef.current()` without circular `useCallback` deps
- **refreshToken backward compat:** existing alias kept, body replaced with `await doRefresh()` — no callers need to change
- **Full-page nav on session expiry:** `<a href="/login">` used instead of `<Link>` to guarantee stale router/query state is cleared before re-authentication
- **No dismiss button on modal:** once the refresh token fails, there is no valid authenticated state to return to; forcing re-login is the only correct action

## Deviations from Plan

None — plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `src/routes/dashboard/_admin/route.tsx` and `vitest.config.ts` were present before these changes and are unrelated. No new errors introduced.

## User Setup Required

None — no external service configuration required.

## Next Phase Readiness

- Token refresh lifecycle is complete: tokens refresh silently before expiry, failures surface gracefully, cross-tab sessions stay synchronized
- `sessionExpired` is available in auth context for any component that needs to react to expired sessions
- Phase 2 Plan 3 (final plan in phase) is complete — phase 02 is ready to close
- Next: Phase 3 (Analytics Backend) can proceed, depends only on Phase 1 auth foundation

---
*Phase: 02-auth-frontend-token-refresh*
*Completed: 2026-02-19*
