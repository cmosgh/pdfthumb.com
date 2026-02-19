# Phase 3: Analytics Backend - Research

**Researched:** 2026-02-19
**Domain:** NestJS BullMQ queue, NestJS interceptors, TypeORM analytics aggregation
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Event Data Shape
- Standard schema: user_id, api_key_id, timestamp, success (boolean), status_code, duration_ms
- Track per API key — store `api_key_id` alongside `user_id` so per-key analytics are possible
- Error categorization: store an `error_code` string (bounded enum: e.g. `INVALID_PDF`, `TIMEOUT`, `UNKNOWN`) rather than a raw boolean; enables failure analysis by category
- IP/user-agent: Skip — not stored; GDPR-conscious default

#### Fire-and-Forget Failure Handling
- Use **Bull/BullMQ with Redis** — durable queue (events survive process restarts)
- Share the **existing Redis instance** — no dedicated connection
- Retry policy: **5 attempts** with exponential backoff, then move to a **dead-letter queue** (not silently discarded)
- Tracking failures must never propagate to the thumbnail response — interceptor always resolves

#### Aggregation Granularity
- Response shape: **daily buckets for last N days** — an array of day objects, not all-time totals
- Lookback window: **configurable via `?days=N`**
- Each daily bucket includes: `date`, `call_count`, `error_count`, `avg_duration_ms`, `unique_api_keys`
- No all-time totals in the response body

#### Admin Endpoint Scope
- Same `?days=N` query param as user endpoint — admin sees platform-wide daily buckets
- Response includes: platform-wide daily bucket array (same shape as user endpoint) + two ranked lists:
  - Top 10 users by **call volume** (user_id, email or identifier, total calls)
  - Top 10 users by **error count** (user_id, email or identifier, error count)

### Claude's Discretion
- Error code enum values and storage type (VARCHAR vs enum column)
- Exact Bull job configuration (concurrency, job timeout)
- Dead-letter queue visibility (e.g. whether to expose a `/api/analytics/admin/dlq` endpoint or just log)
- Default value for `?days=N` (suggest 30)
- Whether platform daily bucket array also includes the two ranked lists inline or as separate keys

### Deferred Ideas (OUT OF SCOPE)
- None — discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| ANLX-01 | `usage_events` table records each thumbnail generation (userId, eventType, isError, durationMs, createdAt) | TypeORM entity with `isProduction ? 'timestamp' : 'datetime'` pattern (established in codebase); migration via manual SQL (matching existing migrations pattern); new fields beyond the base schema based on CONTEXT.md decisions |
| ANLX-02 | `UsageTrackingInterceptor` on `ThumbnailController` writes events fire-and-forget | NestJS `NestInterceptor` + RxJS `tap()` for post-response side effects; `@InjectQueue()` to enqueue events; `catchError()` swallowed so interceptor never throws; `context.switchToHttp().getRequest()` to access `req.user` |
| ANLX-03 | `GET /api/analytics/summary` returns authenticated user's own aggregated stats | `JwtOrApiKeyAuthGuard` (matching thumbnail controller pattern); `@Query('days', new DefaultValuePipe(30), ParseIntPipe)` for `?days=N`; raw SQL with `DATE_TRUNC` (Postgres) / `strftime` (SQLite) for daily bucketing |
| ANLX-04 | `GET /api/analytics/admin/summary` returns platform-wide aggregate stats (admin-only) | `JwtAuthGuard` + `RolesGuard` + `@Roles(UserRole.ADMIN)` (matching `AdminController.ping` pattern from Phase 1); same `?days=N` param; platform-wide query plus two ranked `TOP 10` sub-queries |
</phase_requirements>

---

## Summary

Phase 3 introduces three distinct technical concerns: a durable write queue (BullMQ), a non-blocking NestJS interceptor, and aggregated analytics queries. None of these exist in the codebase today.

**BullMQ is not yet installed.** The backend already has a Redis Sentinel infrastructure for caching (via `@keyv/redis`), but BullMQ uses ioredis directly with a separate connection configuration. The critical constraint is: in development/test, Redis is skipped entirely (app uses in-memory cache). BullMQ must be conditioned the same way — use a no-op queue stub or skip-worker pattern for non-production, so tests do not require a live Redis.

**The interceptor** attaches to `ThumbnailController` via `@UseInterceptors()`. It runs `tap()` on the response stream to extract timing/status info, then calls `queue.add()` fire-and-forget. Errors from `queue.add()` must be caught and logged — never rethrown. The user identity (`req.user.id`, `req.user.id` for `userId`) comes from the request already populated by `JwtOrApiKeyAuthGuard`. The `api_key_id` is NOT available on `req.user` — it must be extracted separately (see Architecture Patterns).

**The aggregation queries** cannot use standard TypeORM `QueryBuilder` group-by due to SQLite incompatibilities with `DATE_TRUNC`. Use the repository's `query()` method with raw SQL, branching on `isProduction` — `DATE_TRUNC('day', ...)` for Postgres, `strftime('%Y-%m-%d', ...)` for SQLite. This mirrors how the entity column types already branch (established pattern in the codebase).

**Primary recommendation:** Install `@nestjs/bullmq@^11.0.0` + `bullmq@^5.0.0`; create a new `analytics` module following the existing module-per-domain pattern; use `BullModule.forRootAsync` with ConfigService for Redis Sentinel in production; implement the interceptor with `tap()` + swallowed `catchError()`; use raw SQL for aggregation with the `isProduction` branch.

---

## Standard Stack

### Core (NEW — not yet installed)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/bullmq` | ^11.0.0 | NestJS integration for BullMQ | Official NestJS package; NestJS 11 compatible; provides `BullModule`, `@InjectQueue`, `@Processor`, `@OnWorkerEvent` decorators |
| `bullmq` | ^5.0.0 | Peer dependency of `@nestjs/bullmq` | The queue engine; Redis-backed, durable, ioredis under the hood |

### Core (already installed — no additional install)

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| `@nestjs/common` | 11.1.6 | `NestInterceptor`, `ExecutionContext`, `CallHandler`, `UseInterceptors`, `Query`, pipes | Already in codebase |
| `rxjs` | 7.8.2 | `tap()`, `catchError()` RxJS operators for interceptor stream handling | Already in codebase |
| `typeorm` | ^0.3.27 | Entity definition, migration runner, raw `query()` method for aggregations | Already in codebase |
| `@nestjs/typeorm` | ^11.0.0 | `InjectRepository`, `TypeOrmModule.forFeature()` | Already in codebase |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `@nestjs/common` ParseIntPipe + DefaultValuePipe | built-in | Validate and default `?days=N` query param | Use in controller method signature |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| `@nestjs/bullmq` | Direct `bullmq` without NestJS wrapper | More control but loses DI integration, `@Processor` decorator, `@OnWorkerEvent` pattern |
| `@nestjs/bullmq` | `@nestjs/bull` (older) | `@nestjs/bull` uses `bull` v4 (not BullMQ v5); user decision is BullMQ |
| Raw SQL for aggregation | TypeORM QueryBuilder | QueryBuilder `.groupBy()` with `DATE_TRUNC` does not work in SQLite; raw SQL branches per DB |
| In-queue events | Direct DB write in interceptor | Direct write blocks response in failure; queue provides retry + backpressure + durability |

**Installation:**
```bash
npm install @nestjs/bullmq bullmq
```

---

## Architecture Patterns

### Recommended Project Structure

```
src/
├── analytics/
│   ├── analytics.module.ts        # Module wiring: BullModule.registerQueue, TypeOrmModule.forFeature
│   ├── analytics.controller.ts    # GET /api/analytics/summary + admin sub-path
│   ├── analytics.service.ts       # Aggregation queries (raw SQL)
│   ├── analytics.processor.ts     # @Processor('usage-events') — persists jobs to DB
│   ├── usage-tracking.interceptor.ts  # @UseInterceptors — enqueues events
│   ├── entities/
│   │   └── usage-event.entity.ts  # TypeORM entity for usage_events table
│   └── dto/
│       └── analytics-summary.dto.ts   # Response shape DTOs
├── migrations/
│   └── <timestamp>-AddUsageEventsTable.ts  # Migration for usage_events
```

### Pattern 1: NestJS BullMQ Module Registration with Redis Sentinel

**What:** Register `BullModule` globally in `AppModule` using `forRootAsync` to inject `ConfigService` for Sentinel configuration. Mirror the existing `CacheModule.registerAsync` pattern that already branches on `NODE_ENV`.

**Critical constraint:** In `development` and `test` environments, Redis Sentinel is not available. BullMQ MUST be configured to skip or use a direct localhost connection — the existing app health check explicitly skips Redis in non-production. A practical approach is to configure BullMQ with a localhost Redis in dev/test and skip the worker startup, or use a conditional `skipWorker: true` on the Processor. Since dev uses SQLite and no Redis, the simplest approach is: if `NODE_ENV !== 'production'`, configure BullMQ with `{ host: 'localhost', port: 6379 }` (same as existing test stub in `thumbnail.e2e-spec.ts`) and wrap the processor in a guard that no-ops if Redis is unavailable.

**When to use:** In `AppModule` registration, mirroring the existing `CacheModule.registerAsync` pattern.

```typescript
// Source: docs.bullmq.io/guide/nestjs + codebase pattern matching
// In app.module.ts (or analytics.module.ts if queue is local to analytics)
BullModule.forRootAsync({
  imports: [ConfigModule],
  inject: [ConfigService],
  useFactory: (configService: ConfigService) => {
    const isProduction = configService.get<string>('NODE_ENV') === 'production';
    if (isProduction) {
      return {
        connection: {
          sentinels: [
            {
              host: configService.get<string>('REDIS_SENTINEL_HOST') || 'my-redis.redis.svc.cluster.local',
              port: configService.get<number>('REDIS_SENTINEL_PORT') || 26379,
            },
          ],
          name: configService.get<string>('REDIS_MASTER_NAME') || 'mymaster',
          password: configService.get<string>('REDIS_PASSWORD'),
        },
      };
    }
    // Dev/test: use local Redis or disable queuing entirely
    return {
      connection: {
        host: 'localhost',
        port: 6379,
      },
    };
  },
}),
```

### Pattern 2: UsageTrackingInterceptor (Fire-and-Forget)

**What:** A NestJS interceptor that runs after the controller responds. Uses `tap()` to capture response timing and status, then calls `queue.add()` without awaiting — errors are swallowed and logged. The interceptor MUST NOT block the thumbnail response under any circumstances.

**Critical detail about `api_key_id`:** The `req.user` object (populated by `JwtOrApiKeyAuthGuard`) contains `{ id, email, roles }` from JWT strategy — it does NOT contain `api_key_id`. When authenticated via API key, the raw `x-api-key` header is available but not the key's UUID. To get the `api_key_id`, the interceptor would need to call `ApiKeyService` to look up the key — this adds latency. **Recommendation (Claude's discretion):** Store the `api_key_id` as nullable in `usage_events`. For JWT-authenticated requests, it will be `null`. For API-key-authenticated requests, include the key's prefix+suffix in the queue job data so the processor can resolve the UUID asynchronously (no interceptor latency hit). Alternatively, the guard itself could attach the resolved `api_key_id` to `req` — check if `ApiKeyAuthGuard` does this already.

**Key finding:** `ApiKeyAuthGuard` does `request.user = user` but does NOT attach the `apiKeyEntity.id` to the request. The guard resolves the full `User` entity, not the `ApiKey`. To get `api_key_id`, the interceptor must read the `x-api-key` header and pass it to the processor, which then does an async lookup.

**When to use:** Attached via `@UseInterceptors(UsageTrackingInterceptor)` on `ThumbnailController` class (covers all three endpoints: `/zip`, `/count`, `/page`).

```typescript
// Source: NestJS interceptors docs + codebase pattern matching
import {
  Injectable, NestInterceptor, ExecutionContext, CallHandler, Logger,
} from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { Observable } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';

@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  private readonly logger = new Logger(UsageTrackingInterceptor.name);

  constructor(@InjectQueue('usage-events') private readonly queue: Queue) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const request = context.switchToHttp().getRequest();
    const startTime = Date.now();
    const user = request.user as { id: string } | undefined;
    const apiKeyHeader = request.headers['x-api-key'] as string | undefined;

    return next.handle().pipe(
      tap((responseData) => {
        const durationMs = Date.now() - startTime;
        const response = context.switchToHttp().getResponse();
        const statusCode = response.statusCode;

        // Fire-and-forget: do not await
        this.queue.add('track-usage', {
          userId: user?.id ?? null,
          apiKeyRaw: apiKeyHeader ?? null, // processor resolves to api_key_id
          statusCode,
          success: statusCode < 400,
          errorCode: null, // set by processor on failure paths
          durationMs,
          timestamp: new Date().toISOString(),
        }).catch((err) => {
          // Swallow — tracking failure MUST NOT affect thumbnail response
          this.logger.warn('Failed to enqueue usage event', err);
        });
      }),
      catchError((error) => {
        // Also track error responses
        const durationMs = Date.now() - startTime;
        this.queue.add('track-usage', {
          userId: user?.id ?? null,
          apiKeyRaw: apiKeyHeader ?? null,
          statusCode: error.status ?? 500,
          success: false,
          errorCode: deriveErrorCode(error),
          durationMs,
          timestamp: new Date().toISOString(),
        }).catch((err) => {
          this.logger.warn('Failed to enqueue error usage event', err);
        });
        throw error; // Re-throw so the original error response is still sent
      }),
    );
  }
}

function deriveErrorCode(error: any): string {
  // Bounded enum: INVALID_PDF | TIMEOUT | UNKNOWN
  if (error.message?.includes('PDF')) return 'INVALID_PDF';
  if (error.message?.includes('timeout') || error.code === 'ETIMEDOUT') return 'TIMEOUT';
  return 'UNKNOWN';
}
```

### Pattern 3: BullMQ Processor (Persists to DB)

**What:** A `@Processor` that consumes jobs from the `usage-events` queue and writes to the `usage_events` table. Resolves `api_key_id` from the raw key via `ApiKeyService` (async, happens inside the job so it doesn't slow the HTTP response).

**Job retry config:** `attempts: 5` with `backoff: { type: 'exponential', delay: 1000 }` (BullMQ will retry after 1s, 2s, 4s, 8s, 16s). Dead-letter: listen to `@OnWorkerEvent('failed')` — when `job.attemptsMade >= job.opts.attempts`, move job data to a `usage-events-dlq` queue for inspection (just `queue.add()` to the DLQ queue). The DLQ is not exposed via HTTP endpoint (Claude's discretion: log + queue only; no admin DLQ endpoint in Phase 3).

```typescript
// Source: docs.bullmq.io/guide/nestjs + official BullMQ docs
import { Processor, WorkerHost, OnWorkerEvent } from '@nestjs/bullmq';
import { InjectQueue } from '@nestjs/bullmq';
import { Job, Queue } from 'bullmq';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { UsageEvent } from './entities/usage-event.entity';
import { Logger } from '@nestjs/common';

@Processor('usage-events', {
  concurrency: 5,
  // BullMQ production: set maxRetriesPerRequest: null on worker connection
  // to prevent worker breaking on temporary Redis disconnects
})
export class AnalyticsProcessor extends WorkerHost {
  private readonly logger = new Logger(AnalyticsProcessor.name);

  constructor(
    @InjectRepository(UsageEvent)
    private readonly usageEventRepo: Repository<UsageEvent>,
    @InjectQueue('usage-events-dlq')
    private readonly dlqQueue: Queue,
    private readonly apiKeyService: ApiKeyService,
  ) {
    super();
  }

  async process(job: Job): Promise<void> {
    const { userId, apiKeyRaw, statusCode, success, errorCode, durationMs, timestamp } = job.data;

    // Resolve api_key_id asynchronously (inside job — no HTTP response impact)
    let apiKeyId: string | null = null;
    if (apiKeyRaw) {
      const user = await this.apiKeyService.getApiKeyUser(apiKeyRaw);
      // We need the apiKey entity ID, not just the user — see Open Questions
      // Workaround: store prefix+suffix in job, lookup the key entity
    }

    const event = this.usageEventRepo.create({
      userId,
      apiKeyId,
      statusCode,
      success,
      errorCode: errorCode ?? null,
      durationMs,
      createdAt: new Date(timestamp),
    });
    await this.usageEventRepo.save(event);
  }

  @OnWorkerEvent('failed')
  async onFailed(job: Job, err: Error): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 5;
    if (job.attemptsMade >= maxAttempts) {
      this.logger.error(`Job ${job.id} permanently failed after ${job.attemptsMade} attempts`, err.message);
      await this.dlqQueue.add('failed-event', job.data).catch(() => {
        this.logger.error('Failed to move job to DLQ');
      });
    }
  }
}
```

### Pattern 4: usage_events Entity

**What:** TypeORM entity for the `usage_events` table. Follows established codebase convention of branching column types between Postgres (production) and SQLite (dev/test).

**Claude's discretion on error_code storage:** Use `VARCHAR` (not a Postgres enum column). A DB-level enum requires a migration `CREATE TYPE` statement that is hard to extend without another migration. A VARCHAR with application-level validation (TypeScript enum) is simpler, easier to extend, and the bounded set (`INVALID_PDF`, `TIMEOUT`, `UNKNOWN`) is enforced in code.

```typescript
// Source: codebase pattern (api-key.entity.ts, user-subscription.entity.ts)
import { Entity, PrimaryGeneratedColumn, Column, Index, ManyToOne, JoinColumn } from 'typeorm';

const isProduction = process.env.NODE_ENV === 'production';

export enum ErrorCode {
  INVALID_PDF = 'INVALID_PDF',
  TIMEOUT = 'TIMEOUT',
  UNKNOWN = 'UNKNOWN',
}

@Entity('usage_events')
@Index(['userId', 'createdAt'])  // Supports per-user time-range queries
@Index(['createdAt'])            // Supports platform-wide time-range queries
export class UsageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;

  @Column({ type: 'varchar', nullable: true })
  apiKeyId: string | null;

  @Column({ type: 'int', nullable: false })
  statusCode: number;

  @Column({ type: 'boolean', nullable: false })
  success: boolean;

  @Column({ type: 'varchar', nullable: true })
  errorCode: string | null;  // ErrorCode enum value or null

  @Column({ type: 'int', nullable: false })
  durationMs: number;

  @Column({
    type: isProduction ? 'timestamp' : 'datetime',
    default: () => 'CURRENT_TIMESTAMP',
  })
  createdAt: Date;
}
```

**Note on ANLX-01 vs CONTEXT.md schema:** The requirement spec says `eventType` but the CONTEXT.md (which overrides) specifies `statusCode`, `success` (bool), `error_code` string, `durationMs`. Follow CONTEXT.md. There is no `eventType` field in CONTEXT.md — it is implied by the fact that only thumbnail generation is tracked (all events are the same type in Phase 3). Do not add `eventType` as a column unless the planner explicitly decides otherwise; it would always have the same value.

### Pattern 5: Analytics Aggregation Query (Raw SQL with DB Branch)

**What:** Raw SQL query for daily bucket aggregation. Cannot use `QueryBuilder.groupBy()` for this use case because `DATE_TRUNC` is Postgres-only and `strftime` is SQLite-only. Raw SQL per database type is the right approach, matching the codebase's established dual-DB-support strategy.

```typescript
// Source: typeorm raw query pattern + PostgreSQL DATE_TRUNC / SQLite strftime docs
// MEDIUM confidence — raw SQL is verified; branching pattern is from codebase inspection

async getUserDailySummary(userId: string, days: number) {
  const isProduction = process.env.NODE_ENV === 'production';
  const dateTruncExpr = isProduction
    ? `DATE_TRUNC('day', "createdAt")`
    : `strftime('%Y-%m-%d', "createdAt")`;

  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  const rows = await this.usageEventRepo.query(
    `SELECT
       ${dateTruncExpr} AS date,
       COUNT(*)::int AS call_count,
       SUM(CASE WHEN success = false THEN 1 ELSE 0 END)::int AS error_count,
       AVG("durationMs")::float AS avg_duration_ms,
       COUNT(DISTINCT "apiKeyId")::int AS unique_api_keys
     FROM usage_events
     WHERE "userId" = $1
       AND "createdAt" >= $2
     GROUP BY ${dateTruncExpr}
     ORDER BY ${dateTruncExpr} ASC`,
    [userId, cutoff.toISOString()],
  );
  return rows;
}
```

**SQLite note:** `strftime('%Y-%m-%d', "createdAt")` returns a string, not a date. The `COUNT(*)::int` cast is Postgres-only syntax — SQLite uses implicit typing. Use `CAST(COUNT(*) AS INTEGER)` for SQLite compatibility, or accept that dev queries return strings without cast. Given dev/test environments don't need production-accurate analytics output, a simple `isProduction` branch covering the date expression is sufficient; the cast syntax difference is acceptable dev-test divergence.

### Pattern 6: Analytics Controller with Guard Pattern

**What:** The `AnalyticsController` follows the exact patterns established in Phase 1. User endpoint uses `JwtOrApiKeyAuthGuard` (same as `ThumbnailController`). Admin endpoint uses `JwtAuthGuard + RolesGuard + @Roles(UserRole.ADMIN)` (same as `AdminController.ping`).

```typescript
// Source: codebase pattern — thumbnail.controller.ts + admin.controller.ts
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('summary')
  @UseGuards(JwtOrApiKeyAuthGuard)
  async getUserSummary(
    @Request() req: { user: { id: string } },
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.analyticsService.getUserDailySummary(req.user.id, days);
  }

  @Get('admin/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAdminSummary(
    @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
  ) {
    return this.analyticsService.getAdminDailySummary(days);
  }
}
```

### Pattern 7: Admin Response Envelope (Claude's Discretion)

**Decision:** Keep the admin response symmetric with the user response — use separate top-level keys rather than nesting the ranked lists inside the daily buckets.

```typescript
// Admin endpoint response shape
{
  "dailyBuckets": [
    { "date": "2026-02-19", "call_count": 1423, "error_count": 12, "avg_duration_ms": 342.5, "unique_api_keys": 87 },
    // ... more days
  ],
  "topUsersByVolume": [
    { "userId": "...", "email": "user@example.com", "totalCalls": 512 },
    // ... up to 10
  ],
  "topUsersByErrors": [
    { "userId": "...", "email": "user@example.com", "errorCount": 23 },
    // ... up to 10
  ]
}
```

This structure (three separate top-level keys) is clean, avoids redundancy, and is easy for Phase 4 frontend to consume independently.

### Anti-Patterns to Avoid

- **Awaiting `queue.add()` in the interceptor:** Makes the interceptor synchronous — defeats fire-and-forget purpose; thumbnail response latency absorbs queue overhead.
- **Throwing errors from the interceptor:** Violates the CONTEXT.md constraint that "tracking failures must never propagate to the thumbnail response."
- **Using TypeORM QueryBuilder `.groupBy()` for analytics:** Known SQLite incompatibility with `DATE_TRUNC`; use raw SQL.
- **Registering `BullModule.forRoot` in `AnalyticsModule`:** BullMQ connection should be registered in `AppModule` (global) so queue configuration is not duplicated across modules. Register `BullModule.registerQueue()` in `AnalyticsModule` only.
- **Storing the raw API key string in `usage_events`:** Security risk. Store only the resolved `api_key_id` UUID. If the processor cannot resolve the ID (key deleted), store `null`.
- **Using a Postgres-native `CREATE TYPE` enum for `error_code`:** Hard to extend without new migrations; use VARCHAR with app-level enum.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Durable job queue | Custom Redis list + polling | BullMQ via `@nestjs/bullmq` | Handles retries, backoff, stalled jobs, DLQ pattern, visibility; Redis list requires all this custom |
| Job retry with exponential backoff | `setTimeout` loops | BullMQ `defaultJobOptions: { attempts, backoff }` | BullMQ handles exponential calculation `2^(attempt-1) * delay`; survives process restarts |
| Fire-and-forget in HTTP request | Detached Promise, `process.nextTick` | BullMQ queue + interceptor `tap()` | Queue survives restarts; detached Promise lost on crash; queue provides visibility into failures |
| DLQ pattern | Custom failed-jobs table | BullMQ `@OnWorkerEvent('failed')` + second queue | Native to BullMQ; monitoring tools (bull-board) can visualize both queues |
| Daily time bucketing | In-memory JS date grouping of all rows | `DATE_TRUNC` / `strftime` in raw SQL + `GROUP BY` | DB-side aggregation handles millions of rows; JS-side requires loading all rows to memory |
| Optional query param with integer parse | Custom middleware | `DefaultValuePipe` + `ParseIntPipe` from `@nestjs/common` | Built-in NestJS pipes; `DefaultValuePipe` MUST precede `ParseIntPipe` to handle absent params |

**Key insight:** BullMQ's value in this phase is durability — analytics data that survives process restarts is business-critical per the CONTEXT.md specifics ("reliable enough to inform business decisions").

---

## Common Pitfalls

### Pitfall 1: Interceptor `tap()` vs `map()` for Side Effects
**What goes wrong:** Using `map()` instead of `tap()` for the fire-and-forget enqueue. `map()` transforms the response data, which will corrupt the thumbnail response if it returns `undefined` from the queue add.
**Why it happens:** Developers confuse `map` (transform) with `tap` (side effect without transformation).
**How to avoid:** Always use `tap()` for side effects that must not modify the response. `tap()` receives the value, performs the side effect, and passes the value through unchanged.
**Warning signs:** Thumbnail endpoint returns `null` or empty response body after interceptor is added.

### Pitfall 2: DuplicatedError from `catchError` in Interceptor
**What goes wrong:** `catchError` in the interceptor swallows the original exception — the client receives a 200 instead of the expected 400/500.
**Why it happens:** `catchError` is used to track error events but the developer forgets to re-throw. `catchError` must call `throwError(() => error)` (RxJS) after tracking.
**How to avoid:** In the `catchError` callback, after enqueuing the error event, always `throw error` (or `return throwError(() => error)` in RxJS style) to propagate the original exception.
**Warning signs:** All thumbnail errors return 200 after adding the interceptor.

### Pitfall 3: BullMQ Worker Breaks in Test/Dev Without Redis
**What goes wrong:** Tests fail with "connection refused" or "ECONNREFUSED 127.0.0.1:6379" when the processor tries to connect to Redis.
**Why it happens:** `@Processor()` registers a BullMQ worker on module init. If Redis is not available, the worker throws on startup.
**How to avoid:** In test environments, either: (a) mock the `Queue` token with `{ add: jest.fn() }` in test modules, or (b) use `BullModule.registerQueue` with `skipWorker: true` option in non-production. The existing test pattern (e2e specs use `AppModule` directly) means tests WILL attempt Redis — add a Redis mock or stub for analytics tests.
**Warning signs:** `NestFactory` throws `Error: connect ECONNREFUSED` when running tests after adding BullMQ.

### Pitfall 4: `ParseIntPipe` Before `DefaultValuePipe` for Optional `?days`
**What goes wrong:** When `?days` is absent from the request, `ParseIntPipe` receives `undefined`, which it cannot convert to an integer — it throws a `BadRequestException`.
**Why it happens:** `ParseIntPipe` is strict — `undefined` is not a parseable integer.
**How to avoid:** Always declare `new DefaultValuePipe(30)` BEFORE `ParseIntPipe` in the `@Query()` pipe array. `DefaultValuePipe` converts `undefined` to `30`, then `ParseIntPipe` receives `"30"` and converts it correctly.
**Warning signs:** `GET /api/analytics/summary` without `?days` returns 400.

### Pitfall 5: `api_key_id` Not Available on `req.user`
**What goes wrong:** Developer assumes `req.user.apiKeyId` exists and stores `undefined` or crashes in the interceptor.
**Why it happens:** `JwtOrApiKeyAuthGuard` populates `req.user` with the result of `JwtStrategy.validate()` or `ApiKeyAuthGuard.canActivate()` — both set `req.user` to a `User` entity or `{ id, email, roles }`, NOT an `ApiKey` entity. The `api_key_id` UUID is not attached to the request by any existing guard.
**How to avoid:** Store the raw `x-api-key` header value in the job data. The `AnalyticsProcessor` resolves it to a UUID asynchronously. Alternatively, if the API key header is absent (JWT auth), store `apiKeyId: null`.
**Warning signs:** All `usage_events` rows have `apiKeyId = null` even for API-key-authenticated requests.

### Pitfall 6: Migration Conflicts Between SQLite (dev) and Postgres (prod)
**What goes wrong:** Migration uses `timestamp` column type which fails on SQLite in dev; or uses `strftime` which is invalid Postgres syntax.
**Why it happens:** Migrations run against the configured DB; the existing codebase handles this with `type: isProduction ? 'timestamp' : 'datetime'` in entity columns. Manual migration SQL must do the same.
**How to avoid:** Write the migration SQL using `datetime` (SQLite-compatible default) OR skip applying migrations in development (the app uses `synchronize: true` in dev, which auto-creates tables from entities). Migrations only run in production. The existing migration scripts confirm this: `synchronize: false` in `createMigrationDataSource`, `synchronize: !isProduction` in `AppModule`.
**Warning signs:** `npm run migration:run` fails locally with "timestamp not supported in sqlite".

---

## Code Examples

Verified patterns from official sources and codebase inspection:

### BullMQ Job Options (5 retries, exponential backoff)
```typescript
// Source: docs.bullmq.io/guide/retrying-failing-jobs
// Formula: delay * 2^(attempt-1), so 1000ms, 2000ms, 4000ms, 8000ms, 16000ms
const defaultJobOptions = {
  attempts: 5,
  backoff: {
    type: 'exponential',
    delay: 1000,  // base delay 1 second
  },
  removeOnComplete: { count: 1000 },  // keep last 1000 completed
  removeOnFail: false,                // keep failed for DLQ inspection
};
```

### BullMQ Queue Registration in Module
```typescript
// Source: docs.bullmq.io/guide/nestjs
@Module({
  imports: [
    BullModule.registerQueue(
      { name: 'usage-events', defaultJobOptions },
      { name: 'usage-events-dlq' },  // dead-letter queue
    ),
    TypeOrmModule.forFeature([UsageEvent]),
    AuthModule,  // for JwtAuthGuard (matching AdminModule pattern)
    CommonModule, // for JwtOrApiKeyAuthGuard
  ],
  controllers: [AnalyticsController],
  providers: [
    AnalyticsService,
    AnalyticsProcessor,
    UsageTrackingInterceptor,
    RolesGuard,
  ],
})
export class AnalyticsModule {}
```

### `@InjectQueue` in Interceptor
```typescript
// Source: docs.bullmq.io/guide/nestjs
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';

constructor(@InjectQueue('usage-events') private readonly queue: Queue) {}
```

### Admin Top-10 Query (Raw SQL)
```typescript
// Source: PostgreSQL aggregation patterns + codebase raw query pattern
async getTopUsersByVolume(days: number, limit = 10) {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);

  return this.usageEventRepo.query(
    `SELECT
       e."userId",
       u."email",
       COUNT(*)::int AS total_calls
     FROM usage_events e
     LEFT JOIN users u ON u.id = e."userId"
     WHERE e."createdAt" >= $1
     GROUP BY e."userId", u."email"
     ORDER BY total_calls DESC
     LIMIT $2`,
    [cutoff.toISOString(), limit],
  );
}
```

### DefaultValuePipe + ParseIntPipe for Optional Query Param
```typescript
// Source: NestJS docs — pipes
// DefaultValuePipe MUST precede ParseIntPipe
@Get('summary')
async getSummary(
  @Query('days', new DefaultValuePipe(30), ParseIntPipe) days: number,
) { ... }
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `@nestjs/bull` (Bull v4) | `@nestjs/bullmq` (BullMQ v5) | 2022-2023 | BullMQ v5 has better TypeScript support, atomic operations, more reliable stall detection |
| Direct DB write in request handler | Interceptor + queue + processor | Industry pattern shift ~2020 | Decouples analytics from business logic; survives DB failures; enables retry |
| `QueryBuilder.groupBy()` for analytics | Raw SQL with `DATE_TRUNC` / `strftime` | TypeORM SQLite limitation (ongoing) | Raw SQL is explicit, DB-agnostic via branching, avoids QueryBuilder quirks with aggregates |

**Deprecated/outdated:**
- `@nestjs/bull`: Uses Bull v4 which is maintenance mode; BullMQ v5 is the active successor. User decision already accounts for this.
- Direct `Promise` fire-and-forget (e.g., `somePromise.catch(() => {})`): Loses events on process restart; BullMQ queue is durable.

---

## Open Questions

1. **How to get `api_key_id` in the processor without a slow lookup**
   - What we know: `ApiKeyService.validateApiKey(plainText)` requires the plain-text key and does a DB lookup. `getApiKeyUser(plainText)` also does a DB lookup. Both are available in the processor (async context — fine).
   - What's unclear: Whether to store the raw plain-text API key in the job (security concern), or store the prefix+suffix (which `ApiKeyService.validateApiKey` needs alongside the full key for hash verification), or add a new `findByPrefixSuffix` method that returns the `ApiKey` entity without hash verification.
   - Recommendation: **Add a method `ApiKeyService.findApiKeyEntityByPrefixSuffix(prefix, suffix): Promise<ApiKey | null>`** that returns the `ApiKey` entity (including `id`) without hash verification. Store `prefix` and `suffix` in the job (4 chars each, not sensitive). The processor resolves `apiKeyId = entity.id`. This avoids storing the plain-text key in Redis/BullMQ.

2. **BullMQ in test environment — mock vs real Redis**
   - What we know: Existing e2e tests use `AppModule` directly (not mocked). Adding BullMQ to `AppModule` means all e2e tests require Redis or a mock.
   - What's unclear: Whether to use a `fakeredis`/`ioredis-mock` library or simply mock the `Queue` provider in test modules.
   - Recommendation: For **unit tests** of the interceptor and processor, mock `@InjectQueue('usage-events')` with `{ add: jest.fn().mockResolvedValue({}) }`. For **e2e tests**, either (a) configure `BullModule.forRoot` to use `testcontainers-redis` if available in CI, or (b) skip BullMQ setup in tests by providing the queue as a mock in the `AppModule` test overrides. The existing `thumbnail.e2e-spec.ts` does not override Redis — adding a `Queue` mock override is the safest path.

3. **`usage_events` row for the `/thumbnail/page` stub endpoint**
   - What we know: `GET /thumbnail/page` currently returns `{ statusCode: 201, message: 'Thumbnail processing started' }` — it is a stub that does not actually process a PDF. The HTTP response code is 200 (NestJS default for GET), not 201.
   - What's unclear: Whether to track this stub endpoint the same as the real endpoints, or skip it.
   - Recommendation: Track it — the interceptor should cover all `ThumbnailController` endpoints. The stub being non-functional is a pre-existing issue, not Phase 3's concern.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `/Users/moshu/development/pdfthumbnailpro/pdfthumbnailpro-be/src/` — all module files, entity files, guard files, migration files
- `docs.bullmq.io/guide/nestjs` — BullMQ NestJS integration guide (WebFetch verified)
- `docs.bullmq.io/guide/retrying-failing-jobs` — Retry configuration (WebFetch verified)
- `docs.bullmq.io/guide/going-to-production` — Production configuration (WebFetch verified)
- `docs.bullmq.io/patterns/stop-retrying-jobs` — DLQ pattern (WebFetch verified)

### Secondary (MEDIUM confidence)
- NestJS interceptors documentation — `tap()` operator pattern for fire-and-forget side effects (WebSearch + LogRocket verified summary)
- `DefaultValuePipe` + `ParseIntPipe` order requirement — NestJS pipes documentation (WebSearch multiple sources consistent)
- BullMQ ioredis Sentinel connection format — `sentinels: [{ host, port }]` (WebSearch verified; consistent with ioredis docs)
- `@nestjs/bullmq@^11.0.0` NestJS 11 compatibility — WebSearch search results consistent (version 11.0.4 confirmed)

### Tertiary (LOW confidence)
- SQLite `strftime('%Y-%m-%d', ...)` syntax for daily aggregation — unverified against a running SQLite; based on SQLite documentation knowledge and TypeORM issues confirming date function differences

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — BullMQ install command and NestJS module API verified via official docs; codebase packages confirmed by direct inspection
- Architecture: HIGH — Interceptor pattern, guard pattern, module structure all derived from codebase conventions; BullMQ processor pattern verified from official docs
- Aggregation queries: MEDIUM — DATE_TRUNC Postgres pattern verified; SQLite strftime branch is sound but not tested against running SQLite in this codebase
- Pitfalls: HIGH — Most derived from direct codebase inspection (guard patterns, entity column types, test environment) + verified BullMQ docs

**Research date:** 2026-02-19
**Valid until:** 2026-03-21 (BullMQ v5 + @nestjs/bullmq v11 APIs are stable; TypeORM patterns are stable)
