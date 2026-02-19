---
phase: 02-auth-frontend-token-refresh
plan: 1
subsystem: frontend-auth
tags: [auth, roles, AuthContext, TanStack Router, token, fetchMe]
dependency_graph:
  requires: [01-02]
  provides: [AUTH-04, authApi.me, fetchMe, isRoleLoading, RouterProvider-auth-context]
  affects: [02-02, 02-03]
tech_stack:
  added: []
  patterns: [fire-and-forget fetchMe, 2-retry with 1s backoff, AuthedApp pattern for live router context]
key_files:
  created: []
  modified:
    - src/types.ts
    - src/api.ts
    - src/hooks/AuthContext.tsx
    - src/main.tsx
    - src/routes/__root.tsx
    - src/routes/auth/callback.tsx
    - src/router.tsx
decisions:
  - "fetchMe uses 2-attempt retry with 1s backoff; on all-retries failure, logout() is called — no silent stuck state"
  - "AuthProvider moved to main.tsx so useAuth() can be called inside AuthedApp above the router"
  - "login() sets isRoleLoading: true immediately; roles come only from fetchMe, never from JWT decode"
  - "fetchMe fires fire-and-forget on mount and after OAuth callback — navigation is not blocked by role fetch"
metrics:
  duration_seconds: 183
  completed_date: "2026-02-19"
  tasks_completed: 2
  tasks_total: 2
  files_modified: 7
---

# Phase 02 Plan 01: Auth Frontend Token Refresh — Wire AuthContext to /api/auth/me Summary

**One-liner:** Role-aware AuthContext with fetchMe() + 2-retry logout logic wired to /api/auth/me, AuthProvider moved to main.tsx, RouterProvider receives live auth state via context.

## What Was Built

Wired the frontend auth layer to the Phase 1 `/api/auth/me` backend endpoint. The key deliverable is a fully functional `fetchMe()` function in `AuthContext` that fetches role data from the backend on mount and after every OAuth login, with automatic logout after 2 failed attempts. The `AuthProvider` was relocated from `__root.tsx` to `main.tsx` so that `useAuth()` can be called in `AuthedApp` — a new component that passes live auth state into the TanStack Router context on every render.

## Tasks Completed

| Task | Name | Commit | Files |
|------|------|--------|-------|
| 1 | Extend types and add authApi.me() | d824519 | src/types.ts, src/api.ts |
| 2 | Add fetchMe() and isRoleLoading to AuthContext, move AuthProvider to main.tsx | 3959f52 | src/hooks/AuthContext.tsx, src/main.tsx, src/routes/__root.tsx, src/routes/auth/callback.tsx, src/router.tsx |

## Decisions Made

1. **fetchMe 2-retry with logout on failure** — If both attempts to reach `/api/auth/me` fail, the user is logged out. This avoids a silent stuck state where tokens exist but the role is unknown. A 1-second backoff separates the two attempts.

2. **AuthProvider in main.tsx, not __root.tsx** — TanStack Router's `RouterProvider` renders inside `__root.tsx`. If `AuthProvider` lives there too, `useAuth()` cannot be called above the router to pass live auth context. Moving `AuthProvider` one level up (to `main.tsx`) allows `AuthedApp` to call `useAuth()` and pass `context={{ auth }}` to `RouterProvider`.

3. **login() sets isRoleLoading: true** — The `login()` function signals that roles are incoming by setting `isRoleLoading: true`. Roles are never decoded from the JWT payload; they always come from `fetchMe()`. This ensures `isRoleLoading` is accurate during the window between login and the first `/api/auth/me` response.

4. **fetchMe is fire-and-forget in callback.tsx** — Navigation to `/dashboard` happens 100ms after login, before `fetchMe` completes. This is intentional: the dashboard should render quickly with a skeleton while `isRoleLoading` is true, rather than blocking on the network call.

## Deviations from Plan

None — plan executed exactly as written.

The only TypeScript errors shown during verification were pre-existing errors in `vitest.config.ts` (missing `vitest` and `@vitejs/plugin-react` type declarations), which are out of scope for this plan and were present before any changes.

## Self-Check: PASSED

All 7 modified files confirmed present on disk. Both task commits (d824519, 3959f52) confirmed in git log.
