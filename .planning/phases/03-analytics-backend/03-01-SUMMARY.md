---
phase: 03-analytics-backend
plan: 01
subsystem: database
tags: [typeorm, postgres, sqlite, migration, analytics]

# Dependency graph
requires:
  - phase: 01-auth-backend-branding
    provides: TypeORM setup, entity glob pattern, migration infrastructure

provides:
  - UsageEvent TypeORM entity with 8 columns and 2 composite indexes
  - ErrorCode enum (INVALID_PDF, TIMEOUT, UNKNOWN) exported from entity file
  - Postgres migration (AddUsageEventsTable) creating usage_events table + indexes
  - usage_events table auto-syncs in SQLite dev/test via entity glob discovery

affects:
  - 03-02 (analytics processor/queue — needs UsageEvent entity to persist events)
  - 03-03 (analytics service/endpoints — needs UsageEvent entity for queries)
  - 05-admin-backend (admin analytics queries join on usage_events)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "isProduction ? 'timestamp' : 'datetime' branch for TypeORM date columns (matches api-key.entity.ts)"
    - "Class-level @Index decorators for composite indexes on TypeORM entities"
    - "No FK relations on analytics entities — store userId/apiKeyId as plain varchar to avoid cascade issues"

key-files:
  created:
    - pdfthumbnailpro-be/src/analytics/entities/usage-event.entity.ts
    - pdfthumbnailpro-be/src/migrations/1771525490376-AddUsageEventsTable.ts
  modified: []

key-decisions:
  - "ErrorCode stored as VARCHAR string (not Postgres enum type) — easier to extend without migrations"
  - "No FK constraints from userId/apiKeyId to users/api_keys — analytics data preserved even if user/key deleted"
  - "Entity auto-discovered by TypeORM glob (entities: [__dirname + '/**/*.entity{.ts,.js}']) — no manual registration needed"

patterns-established:
  - "Analytics entities live in src/analytics/entities/ following existing module structure"
  - "Migration timestamp from Date.now() — consistent with existing migrations (1762960360839, 1762960360840)"

requirements-completed: [ANLX-01]

# Metrics
duration: 3min
completed: 2026-02-19
---

# Phase 3 Plan 01: UsageEvent Entity + Migration Summary

**TypeORM UsageEvent entity with ErrorCode enum, composite indexes, and Postgres migration creating usage_events table with 8 columns**

## Performance

- **Duration:** ~3 min
- **Started:** 2026-02-19T18:24:23Z
- **Completed:** 2026-02-19T18:27:00Z
- **Tasks:** 2
- **Files modified:** 2

## Accomplishments

- Created `UsageEvent` TypeORM entity with all 8 required columns using the established `isProduction ? 'timestamp' : 'datetime'` branch pattern
- Exported `ErrorCode` enum as bounded set (INVALID_PDF, TIMEOUT, UNKNOWN) stored as VARCHAR for schema-free extensibility
- Created `AddUsageEventsTable` Postgres migration with table creation, two composite indexes, and reversible `down()` method
- Entity is auto-discoverable by TypeORM's existing `/**/*.entity{.ts,.js}` glob — no manual registration needed

## Task Commits

Each task was committed atomically:

1. **Task 1: Create UsageEvent entity** - `9505a37` (feat)
2. **Task 2: Create AddUsageEventsTable migration** - `d395d34` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified

- `pdfthumbnailpro-be/src/analytics/entities/usage-event.entity.ts` - UsageEvent entity + ErrorCode enum with composite indexes
- `pdfthumbnailpro-be/src/migrations/1771525490376-AddUsageEventsTable.ts` - Postgres migration for usage_events table and indexes

## Decisions Made

- ErrorCode stored as VARCHAR string (not a Postgres enum type) — avoids needing a migration every time a new error category is added
- No FK constraints on userId/apiKeyId columns — analytics data remains intact even if a user or API key is deleted; queries can join via raw SQL when needed
- Entity placed at `src/analytics/entities/` following the established per-module entity directory convention

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

None.

## User Setup Required

None - no external service configuration required. Migration runs via `npm run migration:run` in production; SQLite dev/test uses TypeORM `synchronize: true`.

## Next Phase Readiness

- `UsageEvent` entity and `usage_events` table schema are in place — Phase 3 plan 02 (analytics queue processor) can now import and persist `UsageEvent` records
- Migration ready to run against production Postgres via `npm run migration:run`
- Entity auto-syncs in SQLite dev/test environments

---
*Phase: 03-analytics-backend*
*Completed: 2026-02-19*
