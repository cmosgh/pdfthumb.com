# Project State

## Project Reference

See: .planning/PROJECT.md (updated 2026-02-18)

**Core value:** Users can get a working API key and start generating PDF thumbnails in under 5 minutes — the portal must make that path frictionless.
**Current focus:** Phase 1 — Auth Backend + Branding

## Current Position

Phase: 1 of 9 (Auth Backend + Branding)
Plan: 2 of 3 in current phase (01-02 pending)
Status: In progress
Last activity: 2026-02-18 — Completed plan 01-03: PDFThumb branding standardization (APP_NAME, HeadContent, per-route head API)

Progress: [██░░░░░░░░] 8%

## Performance Metrics

**Velocity:**
- Total plans completed: 2
- Average duration: ~2.5 min
- Total execution time: ~5 min

**By Phase:**

| Phase | Plans | Total | Avg/Plan |
|-------|-------|-------|----------|
| 01-auth-backend-branding | 2 | ~5 min | ~2.5 min |

**Recent Trend:**
- Last 5 plans: 01-01 (2 min), 01-03 (3 min)
- Trend: —

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

### Pending Todos

None yet.

### Blockers/Concerns

- [Phase 9]: Romania e-invoicing (Oblio/ANAF) scope for B2C international invoices was MEDIUM confidence in research — verify with a Romanian accountant before first live international transaction.
- [Phase 7]: Stripe Tax Dashboard activation steps (product tax codes, business address config) should be tested against a sandbox account before enabling in production.
- [Phase 7]: Confirm whether a monthly reset job exists for `currentMonthlyUsage` in the backend — Phase 7 webhook handlers assume they can reset this counter on `invoice.paid`.

## Session Continuity

Last session: 2026-02-18
Stopped at: Completed 01-03-PLAN.md — PDFThumb branding standardization (APP_NAME constant, HeadContent, per-route head API). Plan 01-02 (admin endpoint) still pending in Phase 1.
Resume file: None
