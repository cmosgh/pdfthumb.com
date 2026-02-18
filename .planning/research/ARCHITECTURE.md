# Architecture Research

**Domain:** Analytics endpoints + Admin RBAC for NestJS + React SPA
**Researched:** 2026-02-18
**Confidence:** HIGH (verified against live codebase + official documentation patterns)

---

## Existing System Inventory

Before recommending architecture, here is what exists today:

**Backend (`pdfthumbnailpro-be`) — confirmed by reading source:**

| Component | Location | State |
|-----------|----------|-------|
| `User` entity | `src/auth/entities/user.entity.ts` | Has `roles: UserRole[]` (USER/ADMIN/SYSTEM) stored as `simple-array` column |
| `JwtStrategy.validate()` | `src/auth/strategies/jwt.strategy.ts` | Returns `{ id, email }` only — **role NOT in JWT** |
| `JwtPayload` interface | `src/auth/interfaces/jwt-payload.interface.ts` | Only `sub` and `email` — **no role claim** |
| `JwtAuthGuard` | `src/auth/guards/jwt-auth.guard.ts` | Extends `AuthGuard('jwt')` — no role checks |
| `ApiKeyAuthGuard` | `src/api-key/guards/api-key-auth.guard.ts` | Validates x-api-key, attaches full `User` entity to `req.user` |
| `JwtOrApiKeyAuthGuard` | `src/common/guards/jwt-or-api-key.guard.ts` | Tries JWT first, falls back to API key |
| `SubscriptionGuard` | `src/subscription/guards/subscription.guard.ts` | Reads userId from CLS context, checks limits, increments `currentMonthlyUsage` |
| Analytics data | `src/subscription/entities/user-subscription.entity.ts` | Only `currentMonthlyUsage` (integer counter) — no event log |
| Admin routes | `subscription-types.controller.ts`, `user-subscriptions.controller.ts` | Use `ApiKeyAuthGuard` as admin proxy |

**Frontend (`pdfthumb.com`) — confirmed by reading source:**

| Component | Location | State |
|-----------|----------|-------|
| `User` type | `src/types.ts` | `{ id, email, name, picture, createdAt, updatedAt }` — **no `role` field** |
| `AuthContext` | `src/hooks/AuthContext.tsx` | Stores user in localStorage, no role awareness |
| Router context | `src/router.tsx` | `{ auth: { isAuthenticated, user } }` — no role in context |
| Analytics data | `src/data/dashboardMocks.ts` | All mock — `DashboardSummary`, `UsageTrendData`, `ErrorLogData`, `GeographicData` |
| Dashboard routes | `src/routes/dashboard/` | `overview.tsx`, `analytics.tsx` use mock data from TanStack DB collections |

---

## Standard Architecture

### System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     React SPA (pdfthumb.com)                     │
│                                                                   │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐   │
│  │ AuthContext  │  │ Router ctx   │  │  TanStack Query      │   │
│  │ user + role  │  │ auth.role    │  │  analyticsApi.*      │   │
│  └──────┬───────┘  └──────┬───────┘  └──────────────────────┘   │
│         │                 │                                       │
│  ┌──────▼─────────────────▼────────────────────────────────┐    │
│  │  beforeLoad guards: /dashboard/admin → check role        │    │
│  └──────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
                              │ HTTP /api/*
┌─────────────────────────────▼───────────────────────────────────┐
│               NestJS Backend (pdfthumbnailpro-be)                │
│                                                                   │
│  JwtAuthGuard → JwtStrategy.validate() → req.user.role           │
│       ↓                                                           │
│  RolesGuard (NEW) → checks req.user.role vs @Roles() metadata    │
│       ↓                                                           │
│  ┌──────────────┐   ┌──────────────┐   ┌─────────────────────┐  │
│  │AnalyticsCtrl │   │AdminCtrl     │   │ UserCtrl (/me)      │  │
│  │GET /analytics│   │(ADMIN only)  │   │ returns role in resp │  │
│  └──────┬───────┘   └──────────────┘   └─────────────────────┘  │
│         │                                                         │
│  ┌──────▼──────────────────────────────────────────────────┐     │
│  │              AnalyticsService                            │     │
│  │   queryAggregate(userId?, dateRange?) → DTO              │     │
│  └──────┬───────────────────────────────────────────────────┘    │
│         │                                                         │
│  ┌──────▼──────────────┐  ┌──────────────────────────────────┐   │
│  │  usage_events table │  │  users + user_subscriptions      │   │
│  │  (new)              │  │  (existing)                      │   │
│  └─────────────────────┘  └──────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Component Responsibilities

| Component | Responsibility | Typical Implementation |
|-----------|----------------|------------------------|
| `RolesGuard` | Reads `@Roles()` metadata, checks `req.user.role` | NestJS guard with `Reflector` |
| `@Roles()` decorator | Attaches allowed roles to route metadata | `SetMetadata(ROLES_KEY, roles)` |
| `AnalyticsModule` | Analytics data capture and query | NestJS module with entity + service + controller |
| `UsageEvent` entity | Persists per-request analytics events | TypeORM entity, appended to DB on thumbnail generation |
| `AnalyticsService` | Aggregates events into dashboard-shaped DTOs | Repository queries with GROUP BY |
| `GET /api/auth/me` | Returns current user including role | Protected endpoint, role from DB lookup |
| `analyticsApi` | Frontend HTTP client for analytics data | Added to `src/api.ts` following existing pattern |
| Router context role | Enables `beforeLoad` role checks | Added to `RouterContext` interface |
| `_admin` pathless route | Admin-only route group in TanStack Router | `beforeLoad` redirects non-admins |

---

## Recommended Project Structure

### Backend additions (`src/analytics/`)

```
src/
├── analytics/
│   ├── analytics.module.ts        # Imports UsageEvent entity, registers service/controller
│   ├── analytics.controller.ts    # GET /api/analytics/summary, /api/analytics/trends
│   ├── analytics.service.ts       # Aggregate queries, admin vs user scoping
│   ├── entities/
│   │   └── usage-event.entity.ts  # Per-request event log table
│   ├── dto/
│   │   ├── analytics-summary.dto.ts
│   │   └── analytics-query.dto.ts  # dateRange, userId (admin only)
│   └── interceptors/
│       └── usage-tracking.interceptor.ts  # Records event after response
├── auth/
│   ├── guards/
│   │   └── roles.guard.ts          # NEW: RolesGuard using Reflector
│   ├── decorators/
│   │   └── roles.decorator.ts      # NEW: @Roles(...UserRole[])
│   ├── interfaces/
│   │   └── jwt-payload.interface.ts  # ADD role claim
│   └── strategies/
│       └── jwt.strategy.ts           # MODIFY: add role to validate() return
```

### Frontend additions (`src/`)

```
src/
├── api.ts                          # ADD: analyticsApi object
├── types.ts                        # ADD: role field to User, AnalyticsSummary type
├── router.tsx                      # ADD: role to RouterContext
├── hooks/
│   └── AuthContext.tsx             # ADD: role stored in user from /me response
├── routes/
│   └── dashboard/
│       ├── _admin.tsx              # NEW: pathless admin route group (beforeLoad guard)
│       ├── _admin/
│       │   └── admin.tsx           # Admin panel page
│       ├── overview.tsx            # MODIFY: replace mock data with analyticsApi calls
│       └── analytics.tsx           # MODIFY: replace mock data with analyticsApi calls
└── components/
    └── dashboard/
        └── DashboardSidebar.tsx    # MODIFY: show Admin nav item if role === 'admin'
```

---

## Architectural Patterns

### Pattern 1: Role in JWT Payload (Backend — modify existing auth)

**What:** Add `role` to the JWT token payload when it is signed. The `JwtStrategy.validate()` method then returns the role, making it available on `req.user` for all guards downstream.

**When to use:** Always — this is the prerequisite for all RBAC on the backend.

**Trade-offs:** Role is baked into the token at sign time. If a user's role changes, they need to re-authenticate for the new role to take effect. Acceptable for a small-team admin feature.

**Example:**

```typescript
// src/auth/interfaces/jwt-payload.interface.ts (MODIFIED)
export interface JwtPayload {
  sub: string;
  email: string;
  role: UserRole;  // ADD THIS
}

// src/auth/auth.service.ts — generateTokens() (MODIFIED)
async generateTokens(user: User) {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email || '',
    role: user.roles[0] ?? UserRole.USER,  // primary role
  };
  const accessToken = this.jwtService.sign(payload);
  // ...
}

// src/auth/strategies/jwt.strategy.ts — validate() (MODIFIED)
validate(payload: JwtPayload) {
  return { id: payload.sub, email: payload.email, role: payload.role };
}
```

---

### Pattern 2: NestJS RolesGuard + @Roles() Decorator (Backend — new)

**What:** A custom guard reads route metadata set by the `@Roles()` decorator and compares it against `req.user.role`. Must run after `JwtAuthGuard` because it depends on `req.user` being populated.

**When to use:** On every admin-only controller method. Applied alongside `JwtAuthGuard`.

**Trade-offs:** Guard order matters — `JwtAuthGuard` must come first. The `Reflector.getAllAndOverride` pattern checks both method and class metadata, making it safe to use at controller or method level.

**Example:**

```typescript
// src/auth/decorators/roles.decorator.ts (NEW)
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

// src/auth/guards/roles.guard.ts (NEW)
import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);
    if (!requiredRoles) return true; // No @Roles() = public to authenticated users

    const { user } = context.switchToHttp().getRequest();
    return requiredRoles.includes(user?.role);
  }
}

// Usage in a controller (NEW admin analytics endpoint)
@Roles(UserRole.ADMIN)
@UseGuards(JwtAuthGuard, RolesGuard)   // JWT first, then roles
@Get('all-users')
getAdminAnalytics() { /* ... */ }
```

**Why not ApiKeyAuthGuard as the admin proxy (current approach):** API keys are scoped to a user, not a role. Any user with an API key could theoretically access "admin" routes if the key is leaked. Role-based guards tied to the authenticated session are more secure and semantically correct.

---

### Pattern 3: Analytics Data Model — `usage_events` Table (Backend — new)

**What:** A new `usage_events` TypeORM entity records one row per thumbnail generation event. Dashboard queries aggregate this table instead of relying on the single `currentMonthlyUsage` counter.

**When to use:** When you need time-series data (trends, date ranges, error rates). The existing `currentMonthlyUsage` counter is too coarse — it cannot answer "how many PDFs were processed on Tuesday?" or "what was the error rate last week?"

**Trade-offs:** More storage than a counter, but SQLite/PostgreSQL handles millions of rows fine at this scale. Daily aggregation queries with `GROUP BY DATE(created_at)` are fast with an index on `(user_id, created_at)`.

**Example:**

```typescript
// src/analytics/entities/usage-event.entity.ts (NEW)
import { Entity, PrimaryGeneratedColumn, Column, Index, CreateDateColumn } from 'typeorm';

export enum EventType {
  THUMBNAIL_GENERATED = 'thumbnail_generated',
  API_CALL = 'api_call',
  ERROR = 'error',
}

@Entity('usage_events')
@Index(['userId', 'createdAt'])           // Critical for date-range queries
@Index(['userId', 'eventType'])
export class UsageEvent {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'varchar', nullable: true })
  userId: string | null;               // null for unauthenticated or system events

  @Column({ type: 'varchar' })
  eventType: EventType;                // thumbnail_generated | api_call | error

  @Column({ type: 'boolean', default: false })
  isError: boolean;

  @Column({ type: 'varchar', nullable: true })
  errorType: string | null;           // e.g. 'invalid_pdf', 'rate_limit'

  @Column({ type: 'integer', nullable: true })
  durationMs: number | null;          // processing time

  @CreateDateColumn()
  createdAt: Date;
}
```

**Aggregate query pattern (AnalyticsService):**

```typescript
// Per-user summary (used by regular dashboard)
async getUserSummary(userId: string): Promise<AnalyticsSummaryDto> {
  const [total, errors] = await Promise.all([
    this.usageEventRepo.count({ where: { userId, eventType: EventType.THUMBNAIL_GENERATED } }),
    this.usageEventRepo.count({ where: { userId, isError: true } }),
  ]);
  return { totalThumbnailsGenerated: total, totalErrors: errors, errorRate: errors / total };
}

// Admin: all users aggregate
async getGlobalSummary(): Promise<AnalyticsSummaryDto> {
  const total = await this.usageEventRepo.count({ where: { eventType: EventType.THUMBNAIL_GENERATED } });
  // ...
}
```

---

### Pattern 4: UsageTrackingInterceptor — Non-blocking Event Write (Backend — new)

**What:** An NestJS interceptor that fires after the response is sent, writing a `UsageEvent` row asynchronously. It does not block the response path.

**When to use:** On the `ThumbnailController`. Applied with `@UseInterceptors()` at the controller level, after the existing `SubscriptionGuard` has already updated `currentMonthlyUsage`.

**Trade-offs:** Fire-and-forget means rare DB write failures are silently lost. Acceptable for analytics (not billing). If eventual consistency is unacceptable, use a queue (Redis Bull). At this scale, direct DB writes are fine.

**Example:**

```typescript
// src/analytics/interceptors/usage-tracking.interceptor.ts (NEW)
@Injectable()
export class UsageTrackingInterceptor implements NestInterceptor {
  constructor(private analyticsService: AnalyticsService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    const start = Date.now();
    const request = context.switchToHttp().getRequest();
    const userId = request.user?.id ?? null;

    return next.handle().pipe(
      tap({
        next: () => {
          // Fire and forget — do not await
          this.analyticsService.recordEvent({
            userId,
            eventType: EventType.THUMBNAIL_GENERATED,
            isError: false,
            durationMs: Date.now() - start,
          }).catch(err => console.error('Analytics write failed:', err));
        },
        error: (err) => {
          this.analyticsService.recordEvent({
            userId,
            eventType: EventType.THUMBNAIL_GENERATED,
            isError: true,
            errorType: err?.message ?? 'unknown',
            durationMs: Date.now() - start,
          }).catch(() => {});
        },
      }),
    );
  }
}
```

---

### Pattern 5: GET /api/auth/me — Role Delivery to Frontend (Backend — new)

**What:** A protected endpoint that returns the current user's profile including their role. The frontend calls this once on login/mount and stores the role in `AuthContext`.

**When to use:** This is the cleanest way to deliver role to the React SPA. The alternative (including role in the auth callback redirect params) is brittle.

**Trade-offs:** Requires one extra HTTP call on app load. Acceptable. Avoids role leaking in URL query params during OAuth redirect.

**Example:**

```typescript
// src/auth/auth.controller.ts (ADD endpoint)
@UseGuards(JwtAuthGuard)
@Get('me')
async getMe(@Request() req) {
  // req.user populated by JwtStrategy.validate()
  // Look up full user from DB to get current role (not stale JWT role)
  const user = await this.authService.findById(req.user.id);
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    role: user.roles[0] ?? UserRole.USER,
  };
}
```

---

### Pattern 6: Role in TanStack Router Context + beforeLoad Guard (Frontend — modify existing)

**What:** Extend the existing `RouterContext` to include `role`. Use `beforeLoad` on a pathless `_admin` layout route to redirect non-admins before the component renders.

**When to use:** For admin-only routes in the dashboard. TanStack Router's `beforeLoad` is the official RBAC mechanism — it runs before any component renders.

**Trade-offs:** The role check happens on every navigation to an admin route. Router context updates (via `router.invalidate()`) propagate role changes immediately without a page reload.

**Example:**

```typescript
// src/router.tsx (MODIFIED)
interface RouterContext {
  auth: {
    isAuthenticated: boolean;
    user: User | null;  // User now has role field
  } | undefined;
}

// src/main.tsx or App.tsx (MODIFIED) — pass updated context
function AuthedRouterProvider() {
  const auth = useAuth();
  useEffect(() => { router.invalidate(); }, [auth.user?.role]);
  return <RouterProvider router={router} context={{ auth }} />;
}

// src/routes/dashboard/_admin.tsx (NEW — pathless layout route)
export const Route = createFileRoute('/dashboard/_admin')({
  beforeLoad: ({ context }) => {
    if (!context.auth?.user) {
      throw redirect({ to: '/login' });
    }
    if (context.auth.user.role !== 'admin') {
      throw redirect({ to: '/dashboard/overview' });
    }
  },
  component: () => <Outlet />,
});

// src/routes/dashboard/_admin/admin.tsx (NEW — admin page)
export const Route = createFileRoute('/dashboard/_admin/admin')({
  component: AdminDashboard,
});
```

**Note:** TanStack Router file-based routing uses the underscore prefix for pathless layout routes. The URL for `_admin/admin.tsx` is `/dashboard/admin` — the `_admin` segment is invisible in the URL.

---

### Pattern 7: Sidebar Role-Based UI (Frontend — conditional render)

**What:** Show/hide the Admin nav item in `DashboardSidebar` based on `useAuth().user.role`. This is UI-only gating — the actual protection is in the `beforeLoad` guard.

**When to use:** Always pair UI gating with route guard gating. UI gating alone is not security — it is UX.

**Example:**

```typescript
// src/components/dashboard/DashboardSidebar.tsx (MODIFIED)
const { user } = useAuth();

// In nav items list:
{user?.role === 'admin' && (
  <SidebarItem to="/dashboard/admin" label="Admin" icon={<ShieldIcon />} />
)}
```

---

## Data Flow

### Analytics Data Flow (New)

```
User uploads PDF
    ↓
POST /api/thumbnail/zip
    ↓
JwtOrApiKeyAuthGuard (existing) → populates req.user
    ↓
SubscriptionGuard (existing) → increments currentMonthlyUsage (keeps existing quota logic)
    ↓
ThumbnailService.generate() (existing)
    ↓
UsageTrackingInterceptor (new) → fires AFTER response sent
    ↓
AnalyticsService.recordEvent() → INSERT into usage_events (async, non-blocking)
```

### Analytics Query Flow (New)

```
React dashboard mounts
    ↓
analyticsApi.getSummary(token) → GET /api/analytics/summary
    ↓
JwtAuthGuard → validates token
    ↓
AnalyticsController → AnalyticsService.getUserSummary(req.user.id)
    ↓
SELECT COUNT(*) FROM usage_events WHERE user_id = ? AND event_type = 'thumbnail_generated'
    ↓
AnalyticsSummaryDto → JSON response
    ↓
TanStack Query caches result (5min stale time)
    ↓
Components read from Query cache → replaces mock data
```

### RBAC Flow (New)

```
User logs in via Google OAuth
    ↓
AuthService.generateTokens(user) → JWT payload includes role
    ↓
Frontend: /auth/callback stores tokens in localStorage
    ↓
Frontend: AuthContext calls GET /api/auth/me → receives { role }
    ↓
User type updated to include role, stored in AuthContext + localStorage
    ↓
router.invalidate() → all beforeLoad handlers re-run with new role
    ↓
Navigation to /dashboard/admin:
  - beforeLoad checks context.auth.user.role === 'admin'
  - If ADMIN: renders admin page
  - If USER: redirect({ to: '/dashboard/overview' })
```

### Role Delivery: How Frontend Knows User's Role

```
Option A (recommended): GET /api/auth/me after login
  1. OAuth callback stores tokens
  2. AuthContext.login() triggers → immediately calls GET /api/auth/me
  3. Response includes role → stored in User object in context + localStorage
  Confidence: HIGH — verified pattern from official TanStack Router docs

Option B (deferred): Include role in OAuth redirect params
  1. Backend adds ?role=admin to /auth/callback redirect URL
  2. Frontend reads from URL, stores alongside tokens
  Confidence: LOW — role in URL params is fragile and leaks to browser history
```

Use **Option A**.

---

## Scaling Considerations

| Scale | Architecture Adjustments |
|-------|--------------------------|
| 0-10k events/day | Direct TypeORM INSERT in interceptor, no queue. Index on (user_id, created_at) is sufficient. |
| 10k-1M events/day | Add a lightweight job queue (Bull + Redis) to batch INSERT events. Separate analytics reads from thumbnail writes. |
| 1M+ events/day | Time-series DB (TimescaleDB hypertables or ClickHouse). Daily aggregate materialized views for dashboard queries. |

### Scaling Priorities

1. **First bottleneck:** Analytics writes slowing down thumbnail responses. Fix: make the interceptor truly fire-and-forget with a local queue (Bull) before inserting.
2. **Second bottleneck:** Dashboard query time grows with event volume. Fix: add a scheduled job that pre-computes daily aggregates into a `usage_daily_summaries` table.

---

## Anti-Patterns

### Anti-Pattern 1: Using ApiKeyAuthGuard as Admin Role Proxy (Current State)

**What people do:** Protect admin routes with `ApiKeyAuthGuard` — only admins have the "system" API key.

**Why it's wrong:** API keys are credential-scoped, not role-scoped. The admin API key can leak. Any user with a valid API key could attempt those routes. There is no way to distinguish an admin's API key from a user's API key inside the guard logic.

**Do this instead:** Use `JwtAuthGuard + RolesGuard` with `@Roles(UserRole.ADMIN)`. The role is verified from the authenticated session, not a shared secret key.

---

### Anti-Pattern 2: Relying Only on Frontend Role-Gating

**What people do:** Hide admin UI with `user.role === 'admin'` conditionals, but don't add `@Roles(UserRole.ADMIN)` guards to the backend endpoints.

**Why it's wrong:** Any authenticated user can call `GET /api/analytics/admin/all-users` with their JWT token. The frontend gating is invisible to the backend.

**Do this instead:** Enforce role at the backend with `RolesGuard`. Frontend gating is UX, not security.

---

### Anti-Pattern 3: Blocking the Response to Write Analytics

**What people do:** `await analyticsService.recordEvent()` inside the controller method, before returning the response.

**Why it's wrong:** Every thumbnail request now waits for two DB writes (the subscription usage counter + the analytics event). At P99, slow DB writes compound into slow thumbnail responses.

**Do this instead:** Use `tap()` in an RxJS pipe inside an interceptor so the analytics write fires after the response has been sent to the client.

---

### Anti-Pattern 4: Storing Role Only in JWT, Never Refreshing

**What people do:** Include role in JWT payload, never call `/api/auth/me`, never invalidate the router. If an admin's role is downgraded, they keep admin access until token expiry.

**Why it's wrong:** JWT has a 1-hour window (based on existing `expiresIn` logic) where a role change is invisible to the app. For admin access, that is a 1-hour privilege escalation window.

**Do this instead:** On login, call `GET /api/auth/me` to get the DB-fresh role. The JWT role is a cache — the `/me` endpoint is the source of truth.

---

### Anti-Pattern 5: Putting Analytics Logic in the Thumbnail Controller

**What people do:** Add usage tracking directly inside `ThumbnailService.generate()`.

**Why it's wrong:** Mixing concerns — thumbnail generation and analytics are distinct domains. Makes the thumbnail service harder to test and extend. The interceptor pattern is cleaner and does not require modifying existing service code.

**Do this instead:** Implement `UsageTrackingInterceptor` applied at the controller level. Zero changes to `ThumbnailService`.

---

## Build Order and Dependencies

This is the critical ordering — each step unblocks the next.

```
1. [BE] Add role to JWT payload + JwtStrategy.validate()
       ↓ unblocks
2. [BE] Implement RolesGuard + @Roles() decorator
       ↓ unblocks
3. [BE] Add GET /api/auth/me endpoint
       ↓ unblocks
4. [FE] Add role to User type, update AuthContext to call /me after login
       ↓ unblocks
5. [FE] Add role to RouterContext, add _admin pathless route with beforeLoad guard
       ↓ unblocks (parallel with 6-9)
6. [BE] Create UsageEvent entity + TypeORM migration
       ↓ unblocks
7. [BE] Implement AnalyticsService + AnalyticsController (user-scoped + admin-scoped endpoints)
       ↓ unblocks
8. [BE] Implement UsageTrackingInterceptor, apply to ThumbnailController
       ↓ unblocks
9. [FE] Add analyticsApi object to src/api.ts + AnalyticsSummary types to types.ts
       ↓ unblocks
10. [FE] Replace mock data in overview.tsx + analytics.tsx with analyticsApi TanStack Query calls
        ↓ unblocks
11. [FE] Show/hide Admin sidebar item based on role
        ↓ unblocks
12. [FE] Build Admin dashboard page at /dashboard/admin
```

---

## Integration Points

### External Services

| Service | Integration Pattern | Notes |
|---------|---------------------|-------|
| PostgreSQL (prod) | TypeORM entity + migration | `usage_events` table is new; add to migration |
| SQLite (dev) | TypeORM entity (same entity, different driver) | SQLite uses `datetime` not `timestamp` — use env check (already done in codebase) |
| TanStack Query (FE) | `useQuery({ queryKey: ['analytics', 'summary'], queryFn: analyticsApi.getSummary })` | 5-min stale time matches existing config |

### Internal Boundaries

| Boundary | Communication | Notes |
|----------|---------------|-------|
| AnalyticsModule ↔ AuthModule | Import `User` entity type only — no circular dependency | Do not import `AuthModule` itself; use raw repository |
| AnalyticsModule ↔ ThumbnailModule | UsageTrackingInterceptor in Analytics module, applied to ThumbnailController via `@UseInterceptors()` | ThumbnailModule must import AnalyticsModule |
| FE AuthContext ↔ Router | AuthContext.user.role flows into RouterProvider context prop | Role change triggers `router.invalidate()` |
| FE analyticsApi ↔ TanStack Query | analyticsApi functions used as `queryFn` — no direct TanStack DB involvement | Replace DB collection subscriptions with Query calls for analytics data |

---

## Sources

- NestJS Guards official pattern: RBAC with `Reflector.getAllAndOverride` — MEDIUM confidence (WebSearch + code samples verified against live codebase guard patterns)
  - https://shpota.com/2022/07/16/role-based-authorization-with-jwt-using-nestjs.html
  - https://docs.nestjs.com/guards (referenced, fetched partially)
- TanStack Router RBAC — `beforeLoad` + pathless route groups: HIGH confidence (official docs URL + verified example code)
  - https://tanstack.com/router/v1/docs/framework/react/how-to/setup-rbac
  - https://spin.atomicobject.com/authenticated-routes-tanstack-router/ (full code verified)
- NestJS interceptor fire-and-forget pattern: MEDIUM confidence (multiple sources consistent)
  - https://blog.logrocket.com/nestjs-interceptors-guide-use-cases/
  - https://medium.com/@tahmidnips/nestjs-interceptors-grafana-timescaledb-combo-for-api-usage-analytics-a-robust-architecture-33d4dd9ae4e1
- Existing codebase: HIGH confidence (direct file reads)
  - `pdfthumbnailpro-be/src/auth/entities/user.entity.ts` — UserRole enum confirmed
  - `pdfthumbnailpro-be/src/auth/strategies/jwt.strategy.ts` — role NOT in payload confirmed
  - `pdfthumbnailpro-be/src/auth/interfaces/jwt-payload.interface.ts` — only sub + email
  - `pdfthumbnailpro-be/src/subscription/entities/user-subscription.entity.ts` — only currentMonthlyUsage

---

*Architecture research for: PDFThumb.io analytics + RBAC milestone*
*Researched: 2026-02-18*
