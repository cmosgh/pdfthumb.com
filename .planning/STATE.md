# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Users can get a working API key and start generating PDF thumbnails in under 5 minutes — the portal must make that path frictionless.
**Current focus:** Phase 2 complete — ready for Phase 3 (Analytics Backend)

## Current Position

Phase: 2 of 9 (Auth Frontend + Token Refresh) — COMPLETE
Plan: 3 of 3 in current phase (02-03 complete)
Status: Phase 2 complete, ready to advance to Phase 3
Last activity: 2026-02-19 — Completed plan 02-03: Proactive token refresh timer, cross-tab sync, session-expired modal

Progress: [████░░░░░░] 22%

## Performance Metrics

**Velocity:**
- Total plans completed: 6
- Average duration: ~2-3 min
- Total execution time: ~17 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-auth-backend-branding | 3 | ~10 min | ~3 min |
| 02-auth-frontend-token-refresh | 3 | ~7 min | ~2 min |

**Recent Trend:**
- Last 5 plans: 01-03 (3 min), 01-02 (5 min), 02-01 (3 min), 02-02 (skipped/merged), 02-03 (2 min)
- Trend: Stable

*Updated after each plan completion*

## Accumulated Context

### Decisions

Decisions are logged in PROJECT.md Key Decisions table.
Recent decisions affecting current work:

- [Roadmap]: BRND-01 bundled into Phase 1 alongside backend RBAC — it is a quick frontend-only change with no dependencies, shipping it alongside the auth foundation avoids a separate phase for a single task.
- [Roadmap]: Analytics backend (Phase 3) depends on Phase 1 only. Admin backend (Phase 5) depends on Phase 1 and Phase 3 — the user list surfaces per-user usage data. Stripe backend (Phase 7) depends on Phase 1 only and is independent of analytics and admin.
- [Roadmap]: Stripe and Romanian Invoicing phases (7, 8, 9) moved to the end of the roadmap so that live analytics and the admin panel ship before payment infrastructure is complete.
- [01-01]: JWT payload is the single source of truth for roles — no DB lookup per request. Eventual consistency trade-off: role changes take effect at next token expiry/re-login.
- [01-01]: RolesGuard is NOT a global APP_GUARD — applied per-route via @UseGuards() to avoid breaking unauthenticated endpoints. Guard ordering: JwtAuthGuard always before RolesGuard.
- [01-03]: APP_NAME set to "PDFThumb" (no TLD) — consistent branding across all surfaces.
- [01-03]: HeadContent rendered inside AuthProvider in root component — OG/meta injected client-side. Root route head() sets global OG defaults; child routes override with route-specific titles only.
- [01-02]: displayName returns null from GET /auth/me — not in JWT payload. Phase 2 frontend falls back to email. TODO added for Phase 2.
- [01-02]: AdminModule imports AuthModule directly (no forwardRef) — no circular dependency exists.
- [02-01]: fetchMe uses 2-attempt retry with 1s backoff; on all-retries failure, logout() is called — no silent stuck state.
- [02-01]: AuthProvider moved to main.tsx so useAuth() can be called in AuthedApp above the router; AuthedApp passes context={{ auth }} to RouterProvider.
- [02-01]: login() sets isRoleLoading: true immediately; roles come only from fetchMe, never from JWT decode.
- [02-03]: scheduleRefreshRef (useRef) pattern breaks circular useCallback dep between doRefresh and scheduleRefresh.
- [02-03]: Session expired shows modal instead of silent logout — refreshToken() kept as backward-compat alias for doRefresh().
- [02-03]: __root.tsx migrated to createRootRouteWithContext<RouterContext>() — fixes TS errors in admin routes that need auth context.

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 9]: Romania e-invoicing (Oblio/ANAF) scope for B2C international invoices was MEDIUM confidence in research — verify with a Romanian accountant before first live international transaction.
- [Phase 7]: Stripe Tax Dashboard activation steps (product tax codes, business address config) should be tested against a sandbox account before enabling in production.
- [Phase 7]: Confirm whether a monthly reset job exists for `currentMonthlyUsage` in the backend — Phase 7 webhook handlers assume they can reset this counter on `invoice.paid`.

## Session Continuity

Last session: 2026-02-19
Stopped at: Completed 02-03-PLAN.md — proactive token refresh timer, cross-tab storage sync, session-expired modal
Resume file: None
