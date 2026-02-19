---
phase: 03-analytics-backend
plan: 02
subsystem: api
tags: [bullmq, redis, nestjs, interceptor, queue, analytics]

# Dependency graph
requires:
  - phase: 03-01
    provides: UsageEvent TypeORM entity and migration for usage_events table

provides:
  - BullMQ globally configured in AppModule (Sentinel in prod, localhost in dev)
  - UsageTrackingInterceptor: fire-and-forget event enqueue via tap()/catchError()
  - AnalyticsProcessor: persists usage_events rows with async api_key_id resolution
  - usage-events queue with 5 retries + exponential backoff; usage-events-dlq for permanent failures
  - ApiKeyService.findApiKeyEntityByPrefixSuffix() for async key-id resolution in processor
  - All ThumbnailController endpoints covered by @UseInterceptors(UsageTrackingInterceptor) at class level

affects: [03-03-analytics-query-api, 05-admin-backend]

# Tech tracking
tech-stack:
  added: ["@nestjs/bullmq@11.0.4", "bullmq@5.69.3"]
  patterns:
    - "Fire-and-forget interceptor: tap() for success path, catchError() re-throws after enqueue"
    - "BullModule.forRootAsync with NODE_ENV branch mirrors CacheModule.registerAsync Sentinel pattern"
    - "api_key_id resolved inside BullMQ job (not HTTP path) to add zero latency to thumbnail response"

key-files:
  created:
    - pdfthumbnailpro-be/src/analytics/usage-tracking.interceptor.ts
    - pdfthumbnailpro-be/src/analytics/analytics.processor.ts
    - pdfthumbnailpro-be/src/analytics/analytics.module.ts
  modified:
    - pdfthumbnailpro-be/package.json
    - pdfthumbnailpro-be/src/app.module.ts
    - pdfthumbnailpro-be/src/api-key/api-key.service.ts
    - pdfthumbnailpro-be/src/thumbnail/thumbnail.controller.ts

key-decisions:
  - "UsageTrackingInterceptor uses tap() not map() — tap() is a side-effect passthrough; map() would corrupt the thumbnail response body"
  - "catchError() MUST call throwError(() => error) after enqueue — without re-throw, all errors return 200 to client"
  - "api_key_id resolved inside BullMQ processor job, not in interceptor — zero HTTP latency impact for key lookup"
  - "Dead-letter queue (usage-events-dlq) receives permanently failed jobs (>= 5 attempts) for manual inspection"
  - "AnalyticsModule exports UsageTrackingInterceptor — ThumbnailController (in AppModule scope) resolves it via DI from AnalyticsModule import"

patterns-established:
  - "BullMQ queue config: defaultJobOptions with attempts:5, backoff exponential 1s base, removeOnComplete:1000"
  - "Processor concurrency set to 5 to parallelise event persistence without overloading DB connection pool"

requirements-completed: [ANLX-02]

# Metrics
duration: 4min
completed: 2026-02-19
---

# Phase 3 Plan 02: BullMQ Analytics Pipeline Summary

**BullMQ fire-and-forget analytics pipeline: UsageTrackingInterceptor enqueues to Redis, AnalyticsProcessor persists usage_events rows with async api_key_id resolution and DLQ on permanent failure**

## Performance

- **Duration:** 4 min
- **Started:** 2026-02-19T18:28:27Z
- **Completed:** 2026-02-19T18:32:03Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- BullMQ installed and globally registered in AppModule with NODE_ENV-branched Redis connection (Sentinel in production, localhost in dev)
- UsageTrackingInterceptor applied at ThumbnailController class level — covers /page, /zip, and /count endpoints with zero latency impact (queue.add not awaited, errors swallowed)
- AnalyticsProcessor persists usage_events rows asynchronously, resolves api_key_id via findApiKeyEntityByPrefixSuffix inside the job, and moves permanently failed jobs to DLQ

## Task Commits

Each task was committed atomically:

1. **Task 1: Install BullMQ + wire AppModule + add findApiKeyEntityByPrefixSuffix** - `52f3721` (feat)
2. **Task 2: Create UsageTrackingInterceptor, AnalyticsProcessor, and AnalyticsModule** - `e50dc7e` (feat)

## Files Created/Modified

- `pdfthumbnailpro-be/src/analytics/usage-tracking.interceptor.ts` - NestJS interceptor: tap() success path + catchError() re-throw pattern for fire-and-forget event enqueue
- `pdfthumbnailpro-be/src/analytics/analytics.processor.ts` - BullMQ WorkerHost: resolves api_key_id, saves UsageEvent to DB, DLQ on permanent failure
- `pdfthumbnailpro-be/src/analytics/analytics.module.ts` - NestJS module: registers usage-events (5 retries/exp backoff) + usage-events-dlq queues, exports UsageTrackingInterceptor
- `pdfthumbnailpro-be/src/app.module.ts` - Added BullModule.forRootAsync (Sentinel/localhost branch) and AnalyticsModule import
- `pdfthumbnailpro-be/src/api-key/api-key.service.ts` - Added findApiKeyEntityByPrefixSuffix() for async entity lookup without hash verification
- `pdfthumbnailpro-be/src/thumbnail/thumbnail.controller.ts` - Added @UseInterceptors(UsageTrackingInterceptor) at class level

## Decisions Made

- `tap()` used (not `map()`) in interceptor success path — tap is a side effect that passes the value through unchanged; map would corrupt the thumbnail response body
- `catchError()` calls `throwError(() => error)` after enqueuing — without re-throw, the client receives 200 for all errors
- `api_key_id` resolved inside the BullMQ processor job, not during the HTTP request, so zero latency is added to thumbnail responses
- DLQ (`usage-events-dlq`) receives jobs after 5 failed attempts — kept for manual inspection (`removeOnFail: false`)
- `AnalyticsModule` exports `UsageTrackingInterceptor` so it can be injected in `ThumbnailController` via the AppModule → AnalyticsModule import chain

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed TypeScript overload resolution error in usageEventRepo.create()**
- **Found during:** Task 2 (TypeScript compilation after creating analytics.processor.ts)
- **Issue:** `usageEventRepo.create({ userId, ... })` triggered TS2769 "No overload matches this call" because TypeScript couldn't disambiguate the array vs single-object overload when passing `null` values
- **Fix:** Changed `null` values to `undefined` (e.g., `userId: userId ?? undefined`) to satisfy `DeepPartial<UsageEvent>` typing — semantically equivalent since nullable columns default to null in the DB
- **Files modified:** pdfthumbnailpro-be/src/analytics/analytics.processor.ts
- **Verification:** `npx tsc --noEmit` passes with zero errors
- **Committed in:** e50dc7e (Task 2 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - TypeScript type bug)
**Impact on plan:** Fix required for compilation. Semantically equivalent — nullable columns still receive null in DB (TypeORM maps `undefined` to `null` for nullable columns).

## Issues Encountered

None beyond the TypeScript overload issue documented in Deviations.

## User Setup Required

None - no external service configuration required for this plan. Redis Sentinel connection is already configured in production via existing environment variables (REDIS_SENTINEL_HOST, REDIS_SENTINEL_PORT, REDIS_MASTER_NAME, REDIS_PASSWORD) used by CacheModule.

## Next Phase Readiness

- Analytics pipeline fully wired: interceptor → BullMQ queue → processor → usage_events table
- Plan 03-03 (analytics query API) can proceed — UsageEvent entity and pipeline are in place
- Redis must be running locally for development (port 6379); BullMQ will fail silently if Redis unavailable since interceptor swallows queue errors

---
*Phase: 03-analytics-backend*
*Completed: 2026-02-19*
