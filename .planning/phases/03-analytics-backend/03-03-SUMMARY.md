---
phase: 03-analytics-backend
plan: 03
subsystem: api
tags: [nestjs, analytics, sql, guards, rbac, typeorm]

# Dependency graph
requires:
  - phase: 03-01
    provides: UsageEvent TypeORM entity and usage_events table
  - phase: 03-02
    provides: BullMQ pipeline wiring UsageTrackingInterceptor and AnalyticsProcessor

provides:
  - AnalyticsService with getUserDailySummary() and getAdminDailySummary() using raw SQL + isProduction branch
  - GET /api/analytics/summary: self-scoped user daily bucket endpoint (JwtOrApiKeyAuthGuard)
  - GET /api/analytics/admin/summary: platform-wide daily buckets + top-10 user rankings (admin-only)
  - DailyBucket, UserSummaryResponse, AdminSummaryResponse TypeScript interfaces

affects: [04-analytics-frontend, 05-admin-backend]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "Raw SQL aggregation with DATE_TRUNC (Postgres) vs strftime (SQLite) isProduction branch"
    - "Boolean SQL comparison: false (Postgres) vs 0 (SQLite) via isProduction branch"
    - "DefaultValuePipe MUST precede ParseIntPipe in @Query() pipe array — order matters"
    - "Admin endpoints use JwtAuthGuard (Bearer only), never JwtOrApiKeyAuthGuard"

key-files:
  created:
    - pdfthumbnailpro-be/src/analytics/analytics.service.ts
    - pdfthumbnailpro-be/src/analytics/analytics.controller.ts
    - pdfthumbnailpro-be/src/analytics/dto/analytics-summary.dto.ts
  modified:
    - pdfthumbnailpro-be/src/analytics/analytics.module.ts

key-decisions:
  - "DefaultValuePipe(30) placed before ParseIntPipe — reversed order causes ParseIntPipe to receive undefined on missing ?days param and throw 400"
  - "Admin endpoint uses JwtAuthGuard (not JwtOrApiKeyAuthGuard) — admin actions must never be callable via API keys"
  - "isProduction branch handles Postgres/SQLite differences: DATE_TRUNC vs strftime for date bucketing, false vs 0 for boolean success column"
  - "AnalyticsModule imports AuthModule and CommonModule directly (no forwardRef) — no circular dependency exists since AuthModule does not import AnalyticsModule"

patterns-established:
  - "Query API pattern: DefaultValuePipe → ParseIntPipe in @Query decorator pipe array"
  - "RBAC admin endpoint pattern: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.ADMIN)"

requirements-completed: [ANLX-03, ANLX-04]

# Metrics
duration: 2min
completed: 2026-02-19
---

# Phase 3 Plan 03: Analytics Query API Summary

**Raw SQL analytics query API exposing daily bucket aggregations per user and platform-wide via JwtOrApiKeyAuthGuard and RBAC-protected admin endpoints**

## Performance

- **Duration:** 2 min
- **Started:** 2026-02-19T18:35:17Z
- **Completed:** 2026-02-19T18:36:51Z
- **Tasks:** 2
- **Files modified:** 4

## Accomplishments

- AnalyticsService with `getUserDailySummary()` and `getAdminDailySummary()` using raw SQL with DB-branched syntax (Postgres DATE_TRUNC / SQLite strftime, false / 0 for boolean)
- GET /api/analytics/summary endpoint: self-scoped per user, accepts optional ?days param (default 30), protected by JwtOrApiKeyAuthGuard
- GET /api/analytics/admin/summary endpoint: platform-wide daily buckets + top-10 users by volume and error count, protected by JwtAuthGuard + RolesGuard + @Roles(ADMIN)
- AnalyticsModule fully wired with AuthModule, CommonModule, AnalyticsController, AnalyticsService, RolesGuard

## Task Commits

Each task was committed atomically:

1. **Task 1: Create AnalyticsService with raw SQL aggregation and DTOs** - `404425d` (feat)
2. **Task 2: Create AnalyticsController and wire AnalyticsModule** - `98eeeb6` (feat)

## Files Created/Modified

- `pdfthumbnailpro-be/src/analytics/analytics.service.ts` - AnalyticsService: getUserDailySummary() and getAdminDailySummary() with isProduction-branched raw SQL
- `pdfthumbnailpro-be/src/analytics/analytics.controller.ts` - AnalyticsController: GET analytics/summary (user) and GET analytics/admin/summary (admin-only)
- `pdfthumbnailpro-be/src/analytics/dto/analytics-summary.dto.ts` - DailyBucket, TopUser, UserSummaryResponse, AdminSummaryResponse interfaces
- `pdfthumbnailpro-be/src/analytics/analytics.module.ts` - Added AnalyticsController, AnalyticsService, AuthModule, CommonModule, RolesGuard imports

## Decisions Made

- `DefaultValuePipe(30)` must precede `ParseIntPipe` in the pipe array — if reversed, a missing `?days` param causes ParseIntPipe to receive `undefined` and throw `400 BadRequestException`, violating the success criterion that `/api/analytics/summary` without `?days` returns 200
- Admin endpoint uses `JwtAuthGuard` (not `JwtOrApiKeyAuthGuard`) — admin operations must never be accessible via API keys, matching `AdminController.ping` pattern from Phase 1
- `isProduction` branch handles two SQLite/Postgres incompatibilities in a single field: date truncation expression (`DATE_TRUNC` vs `strftime`) and boolean column comparison (`false` vs `0`)

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Endpoints are available as soon as the backend server starts.

## Next Phase Readiness

- Analytics backend fully operational: events are captured (Plan 03-02) and queryable (this plan)
- Phase 3 requirements ANLX-01 through ANLX-04 all complete
- Phase 4 (analytics frontend) can proceed — both endpoints return correct JSON shapes with auth enforcement
- Admin endpoint ready for Phase 5 admin backend integration

---
*Phase: 03-analytics-backend*
*Completed: 2026-02-19*
