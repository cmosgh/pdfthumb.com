# Phase 1: Auth Backend + Branding - Research

**Researched:** 2026-02-18
**Domain:** NestJS JWT RBAC + TanStack Router head management
**Confidence:** HIGH

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions

#### Role invalidation policy
- Role changes are rare manual ops — no user-facing flow triggers them
- No existing token blacklist or revocation mechanism in the codebase
- Claude's discretion: choose between eventual consistency (trust JWT claim until expiry) vs. re-fetching role from DB per request, informed by what token expiry is currently configured to
- Researcher should check current access token expiry configuration to inform this choice

#### /api/auth/me endpoint
- New endpoint — does not currently exist
- Response shape: minimal — `id`, `email`, `role` at minimum; researcher should inspect the existing `User` entity and include any additional fields already present that make sense to expose
- Auth method: researcher should match the pattern used by other existing protected routes (Bearer JWT or cookie — check the codebase)
- Error behavior: 401 for expired/invalid token — standard, handled by existing auth guard

#### Admin route guard scope
- `RolesGuard` and `@Roles()` decorator ship in Phase 1 as infrastructure; they are applied to admin routes in the phases where those routes are built (Phases 3, 5, 6)
- Phase 1 must add at least one admin-guarded route to the backend repo (to satisfy the Phase 1 success criterion of verifying 403 behavior) — a minimal route is acceptable
- An automated test (unit or e2e) must verify that a non-admin token receives 403 on the admin route
- RolesGuard application strategy (global APP_GUARD vs. per-route decorator): researcher should check how the existing `JwtAuthGuard` is applied and match that pattern
- Role enum values: researcher should check the existing `User` entity/DB schema for what role values are already defined or stored

#### Branding
- Canonical brand name: **PDFThumb** (no TLD)
- Required locations: site header, footer, all page `<title>` tags, meta tags (description, OG tags)
- Success criterion: no old name variants remain anywhere in the codebase
- Researcher should audit for visual assets (favicon, OG image, logo files) containing outdated names or branding
- Researcher should determine whether branding is centralized (config/constants file) or scattered across components — inform the planner so the plan uses the right approach

### Claude's Discretion
- Exact role invalidation strategy (eventual consistency vs. per-request DB lookup) — decide based on discovered token expiry duration
- Exact response fields for `/api/auth/me` beyond `id`, `email`, `role` — match what the User entity already exposes
- RolesGuard application pattern — match existing guard conventions

### Deferred Ideas (OUT OF SCOPE)
None — discussion stayed within phase scope.
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| AUTH-01 | JWT access token includes user's `role` field (UserRole.USER / ADMIN) | `generateTokens()` in `auth.service.ts` builds the `JwtPayload` — add `role` (or `roles`) there; `JwtPayload` interface must be extended |
| AUTH-02 | `GET /api/auth/me` returns authenticated user's profile including role | New controller method in `auth.controller.ts`; protected by `JwtAuthGuard` (Bearer token pattern); reads `req.user` populated by `JwtStrategy.validate()` which must be updated to include role |
| AUTH-03 | NestJS `RolesGuard` + `@Roles()` decorator enforce backend admin routes | Standard NestJS guard + `SetMetadata` decorator pattern using `Reflector`; applied per-route to match existing codebase convention; placeholder `GET /api/admin/ping` route for 403 test |
| BRND-01 | "PDFThumb" used consistently across all pages (header, footer, page titles, meta tags) | `APP_NAME` constant already exists at `src/constants.ts` but is set to `"PDFThumb.com"` — change to `"PDFThumb"`; `index.html` `<title>` is hardcoded `"PDF Thumbnail API"` — needs fix; no `<head>` management via TanStack Router head API currently set up — must add `HeadContent` to root layout |
</phase_requirements>

---

## Summary

Phase 1 has three distinct sub-problems, all grounded in the existing codebase. The backend work (AUTH-01, AUTH-02, AUTH-03) involves surgical changes to `auth.service.ts`, `jwt.strategy.ts`, `jwt-payload.interface.ts`, and `auth.controller.ts`, plus two new files (`roles.guard.ts`, `roles.decorator.ts`) and a minimal admin controller. The branding work (BRND-01) is almost entirely centralized — one constant needs updating and TanStack Router's `head` API needs to be wired into the root route for per-page title/meta management.

The biggest decision to make concrete: **role invalidation strategy**. The access token expiry is `1h` (confirmed in both `.env` and `.env.example`). One hour is short enough that eventual consistency (trusting the JWT `role` claim until expiry) is the correct choice. Role changes are manual ops, so at worst an admin demotion takes effect in under one hour. There is no existing blacklist infrastructure and building one for this cadence of change would be over-engineering. Use eventual consistency.

**Primary recommendation:** Add `roles` to the JWT payload in `generateTokens()`, update `JwtStrategy.validate()` to pass it through, add `GET /api/auth/me`, build `RolesGuard` + `@Roles()` as per-route decorators (matching the existing pattern), add a placeholder admin route for 403 testing, and update `APP_NAME` + wire up `HeadContent` for branding. No new npm packages required for the backend; TanStack Router's `HeadContent` is already bundled in the existing `@tanstack/react-router@^1.132.25`.

---

## Standard Stack

### Core (already installed — no new packages needed)

| Library | Version in use | Purpose | Status |
|---------|---------------|---------|--------|
| `@nestjs/common` | 11.1.6 | Guards, decorators, `Reflector`, `SetMetadata` | Already installed |
| `@nestjs/core` | 11.1.6 | `Reflector` injection in guards | Already installed |
| `@nestjs/jwt` | ^11.0.0 | JWT signing/verification in `generateTokens()` | Already installed |
| `@nestjs/passport` | ^11.0.5 | `AuthGuard('jwt')` base for `JwtAuthGuard` | Already installed |
| `passport-jwt` | ^4.0.1 | JWT extraction from Bearer header | Already installed |
| `@tanstack/react-router` | ^1.132.25 | Includes `HeadContent`, `head` option on `createFileRoute`/`createRootRoute` | Already installed |

### No additional packages required

The entire Phase 1 implementation uses what is already in the dependency tree. `Reflector` and `SetMetadata` come from `@nestjs/common` and `@nestjs/core` respectively. `HeadContent` is exported from `@tanstack/react-router`.

---

## Architecture Patterns

### Discovered: Guard Application Pattern (per-route, not global)

**Finding (HIGH confidence — direct codebase inspection):** The existing codebase applies guards exclusively at the route level using `@UseGuards()` decorator. There is no `APP_GUARD` global registration in `main.ts` or `app.module.ts`. Guards are applied:

- At the method level: `@UseGuards(JwtOrApiKeyAuthGuard, RateLimitGuard, SubscriptionGuard)` on individual controller methods (see `thumbnail.controller.ts`)
- At the controller level: `@UseGuards(JwtOrApiKeyAuthGuard)` on the entire `ApiKeyController` class
- At the controller level: `@UseGuards(ApiKeyAuthGuard)` on subscription admin controllers

**Instruction for planner:** `RolesGuard` MUST be applied via `@UseGuards(JwtAuthGuard, RolesGuard)` on the admin route, not registered globally. This matches the existing convention.

### Discovered: JWT Payload Shape (currently missing `role`)

**Finding (HIGH confidence — direct codebase inspection):**

Current `JwtPayload` interface (`src/auth/interfaces/jwt-payload.interface.ts`):
```typescript
export interface JwtPayload {
  sub: string; // User ID
  email: string; // User email
  // Add other claims as needed
}
```

Current `generateTokens()` in `auth.service.ts`:
```typescript
const payload: JwtPayload = { sub: user.id, email: user.email || '' };
const accessToken = this.jwtService.sign(payload);
```

The `role` field is **absent from the JWT payload**. AUTH-01 requires adding it.

### Discovered: User Entity Fields

**Finding (HIGH confidence — direct codebase inspection):**

The `User` entity (`src/auth/entities/user.entity.ts`) has:
- `id: string` (UUID primary key)
- `email: string | null`
- `displayName: string | null`
- `refreshToken: string | null` — **do NOT expose in `/api/auth/me`** (security)
- `roles: UserRole[]` — stored as `simple-array` column; defaults to `[UserRole.USER]`
- `connections: Connection[]` — relation, do not expose
- `apiKeys: ApiKey[]` — relation, do not expose

**Recommendation for `/api/auth/me` response shape:**
```typescript
{
  id: string;
  email: string | null;
  displayName: string | null;
  roles: UserRole[];
}
```

This exposes all non-sensitive scalar fields already on the entity. `refreshToken` must be omitted. Relations must be omitted. The `roles` field (array) is exposed as-is — this is correct since Phase 2 frontend will consume it.

### Discovered: Role Enum Values

**Finding (HIGH confidence — direct codebase inspection):**

```typescript
// src/auth/entities/user.entity.ts
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
  SYSTEM = 'system',
}
```

Three role values exist: `USER`, `ADMIN`, `SYSTEM`. The `SYSTEM` role is used by the seed script for internal/API-key-based system user. The `RolesGuard` should accept an array of allowed roles so it can be used for `ADMIN`-only and `ADMIN | SYSTEM` patterns.

**Instruction for planner:** The `@Roles()` decorator should accept `...roles: UserRole[]` variadic args. The placeholder admin route in Phase 1 uses `@Roles(UserRole.ADMIN)`.

### Discovered: JWT Strategy Validation — req.user Shape

**Finding (HIGH confidence — direct codebase inspection):**

`JwtStrategy.validate()` currently returns:
```typescript
validate(payload: JwtPayload) {
  return { id: payload.sub, email: payload.email };
}
```

This is what `req.user` contains after `JwtAuthGuard` runs. For `RolesGuard` to check role from the JWT, `validate()` must also return `roles` after AUTH-01 adds it to the payload.

**Instruction for planner:** Update `JwtStrategy.validate()` to return `{ id: payload.sub, email: payload.email, roles: payload.roles }`. This is the single source of truth for role enforcement on guarded routes — no DB lookup needed.

### Discovered: Role Invalidation Decision

**Finding (HIGH confidence):** Access token `JWT_EXPIRES_IN=1h` (confirmed in `.env` and `.env.example`). Role changes are manual admin operations. No blacklist infrastructure exists.

**Decision: Use eventual consistency.** Trust the `roles` claim in the JWT until it expires (1 hour max lag). Do NOT fetch role from DB on every request in `JwtStrategy.validate()`. This avoids a DB query per authenticated request, is consistent with how every other guard in the codebase works, and the 1-hour lag is acceptable for rare admin-only role changes.

### Discovered: Auth Method on Protected Routes

**Finding (HIGH confidence — direct codebase inspection):**

Protected routes use Bearer JWT via `JwtAuthGuard` (which extends `AuthGuard('jwt')` using `ExtractJwt.fromAuthHeaderAsBearerToken()`). The `/api/auth/logout` route uses `@UseGuards(JwtOrApiKeyAuthGuard)` which tries JWT first then API key.

**Instruction for planner:** `GET /api/auth/me` must use `@UseGuards(JwtAuthGuard)` — JWT Bearer only, not the combined guard. The `/me` endpoint is a user-identity endpoint that should not accept API key auth (which is used for machine-to-machine calls).

### Discovered: Branding Centralization Status

**Finding (HIGH confidence — direct codebase inspection):**

The frontend has a central constants file at `src/constants.ts`:
```typescript
export const APP_NAME = "PDFThumb.com";
```

Usage audit:
- `Navbar.tsx` — imports `APP_NAME`, renders `{APP_NAME}` (desktop) and `{APP_NAME.replace(".com", "")}` (mobile, which already renders "PDFThumb")
- `Footer.tsx` — imports `APP_NAME`, renders `{APP_NAME}` in logo and copyright line

**The current `APP_NAME` value `"PDFThumb.com"` is the only change needed for header/footer.** Changing it to `"PDFThumb"` will fix both Navbar and Footer automatically. The mobile `.replace(".com", "")` in Navbar becomes a no-op and should be removed.

**Page titles — NOT currently managed per-route.** The `index.html` has a static hardcoded `<title>PDF Thumbnail API</title>`. There is no per-route title management at all. TanStack Router's `head` API (`HeadContent` component + `head` option on route definitions) is available in the installed version (`^1.132.25`) but not yet wired up.

**OG/meta tags — completely absent.** No `og:title`, `og:description`, `twitter:card`, or `description` meta tags exist anywhere.

**Visual assets — no public directory.** There is no `public/` directory. No favicon file, no OG image file. These are out of scope to create from scratch in Phase 1 (they would require design work), but the `<title>` and meta tags via TanStack Router's `head` API are in scope.

**Instruction for planner:**
1. Change `APP_NAME` in `src/constants.ts` from `"PDFThumb.com"` to `"PDFThumb"`
2. Remove the `.replace(".com", "")` call in `Navbar.tsx` mobile span (it becomes `{APP_NAME}` for both)
3. Add `HeadContent` component to the root layout (`src/routes/__root.tsx`) rendering inside `<head>` — this requires updating `index.html` to call `<HeadContent />` or, since this is a client-side-only SPA (no SSR), inject `HeadContent` into the React tree near the document head
4. Add `head` option to `createRootRoute` in `__root.tsx` with global defaults: `title: "PDFThumb"`, description meta, OG tags
5. Add per-route `head` to each `createFileRoute` call for differentiated page titles
6. Update `<title>` in `index.html` to `"PDFThumb"` (fallback before React hydrates)

**Note on HeadContent in SPA context:** Since this is a pure client-side Vite SPA (no TanStack Start/SSR), `HeadContent` must be rendered somewhere in the React component tree — it imperatively inserts/removes `<title>` and `<meta>` tags into `document.head`. The correct placement is inside the root component, rendered unconditionally. It does NOT need to be in the literal HTML `<head>` element — it works by injecting into DOM.

### Pattern: Standard NestJS RolesGuard

**Source:** NestJS official documentation pattern (HIGH confidence — verified via codebase conventions and NestJS v11 standard practice)

```typescript
// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

```typescript
// src/auth/guards/roles.guard.ts
import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
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
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const { user } = context.switchToHttp().getRequest();
    const hasRole = requiredRoles.some((role) => user?.roles?.includes(role));
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
```

**Instruction for planner:** `RolesGuard` must always be used AFTER `JwtAuthGuard` in the `@UseGuards()` chain, because `JwtAuthGuard` populates `req.user`. Usage: `@UseGuards(JwtAuthGuard, RolesGuard)` followed by `@Roles(UserRole.ADMIN)`.

### Pattern: Placeholder Admin Route

The Phase 1 success criterion requires a route that returns 403 for non-admin users. The minimal implementation:

```typescript
// src/admin/admin.controller.ts
import { Controller, Get, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import { UserRole } from '../auth/entities/user.entity';

@Controller('admin')
export class AdminController {
  @Get('ping')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  ping() {
    return { status: 'ok' };
  }
}
```

This route is registered in `app.module.ts` and tested with a unit spec that mocks the guard context.

### Pattern: /api/auth/me Endpoint

```typescript
// Addition to auth.controller.ts
@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@Req() req: { user: { id: string; email: string; roles: UserRole[] } }) {
  return req.user;
}
```

Note: `req.user` is populated by `JwtStrategy.validate()` which (after AUTH-01) returns `{ id, email, roles }`. No additional DB lookup is needed — the JWT payload carries the data. This is consistent with the eventual-consistency decision.

### Pattern: TanStack Router head API (SPA usage)

The `head` option is available on all route creation functions in `@tanstack/react-router@1.132.x`:

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet, HeadContent } from "@tanstack/react-router";
import { APP_NAME } from "../constants";

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: APP_NAME },
      { name: 'description', content: 'PDF thumbnail generation API for developers' },
      { property: 'og:title', content: APP_NAME },
      { property: 'og:description', content: 'PDF thumbnail generation API for developers' },
      { property: 'og:site_name', content: APP_NAME },
    ],
  }),
  component: () => (
    <AuthProvider>
      <HeadContent />
      <RootComponent />
    </AuthProvider>
  ),
});
```

Per-route title override example:
```tsx
// src/routes/dashboard.tsx
export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [{ title: `Dashboard | ${APP_NAME}` }],
  }),
  component: DashboardComponent,
});
```

**Instruction for planner:** In SPA mode (no SSR), `HeadContent` can be placed inside the React component tree (not literally inside `<head>` in HTML). It imperatively modifies `document.head`. Render it once in the root component, unconditionally.

---

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Role metadata on routes | Custom metadata system | `SetMetadata` + `Reflector` from `@nestjs/common`/`@nestjs/core` | Standard NestJS RBAC pattern; handles method-vs-class precedence correctly |
| JWT role validation | Per-request DB user lookup | JWT claim (eventual consistency) | 1h expiry makes DB lookup unnecessary; avoids per-request DB overhead |
| Page title management | `document.title = ...` in `useEffect` | TanStack Router `head` API + `HeadContent` | Router-aware, deduplication, SSR-ready, integrated with route lifecycle |
| Guard chaining | Custom middleware | NestJS `@UseGuards()` chain | Tested, DI-aware, works with Passport ecosystem |

---

## Common Pitfalls

### Pitfall 1: RolesGuard before JwtAuthGuard
**What goes wrong:** `req.user` is `undefined` when `RolesGuard` runs, so role check always fails or throws a null reference error.
**Why it happens:** Guard execution order in `@UseGuards()` is left-to-right. If `RolesGuard` runs before `JwtAuthGuard`, the request has not been authenticated yet.
**How to avoid:** Always write `@UseGuards(JwtAuthGuard, RolesGuard)` — `JwtAuthGuard` first, `RolesGuard` second.
**Warning signs:** All requests to admin routes get 401 instead of 403.

### Pitfall 2: JWT payload includes `roles` array but JwtStrategy returns only `role` (scalar)
**What goes wrong:** Mismatch between JWT claim name (`roles` array on `User` entity) and what `RolesGuard` checks.
**Why it happens:** The `User.roles` field is `UserRole[]` (array), but some implementations emit a scalar `role` field in the JWT. Inconsistency between emission and consumption.
**How to avoid:** Use `roles: user.roles` (array) consistently in `JwtPayload`, `generateTokens()`, `JwtStrategy.validate()`, and `RolesGuard`. Do not introduce a singular `role` field.
**Warning signs:** Guard always returns 403 even for ADMIN users.

### Pitfall 3: `APP_NAME` change breaks Navbar mobile logic
**What goes wrong:** `Navbar.tsx` currently has `{APP_NAME.replace(".com", "")}` for mobile. After changing `APP_NAME` to `"PDFThumb"`, the `.replace(".com", "")` is a no-op but remains as dead code.
**Why it happens:** The mobile path was added to strip the TLD from `"PDFThumb.com"`, assuming the constant would always have `.com`.
**How to avoid:** Remove the `.replace(".com", "")` call when updating the constant. Both desktop and mobile spans should render `{APP_NAME}` directly.
**Warning signs:** No functional breakage, but dead code in Navbar remains.

### Pitfall 4: HeadContent rendered multiple times
**What goes wrong:** Multiple `<title>` and duplicate `<meta>` tags appear in `document.head`.
**Why it happens:** `HeadContent` is rendered in more than one place in the component tree (e.g., both in `__root.tsx` and in a nested layout).
**How to avoid:** Render `HeadContent` exactly once, in the root route component.
**Warning signs:** Browser devtools show multiple `<title>` elements.

### Pitfall 5: `Reflector` not injected into RolesGuard
**What goes wrong:** `RolesGuard` cannot read metadata set by `@Roles()` decorator; `requiredRoles` is always `undefined`.
**Why it happens:** `Reflector` is a NestJS core service that must be DI-injected. If `RolesGuard` is instantiated with `new RolesGuard()` instead of being provided through DI, `Reflector` is missing.
**How to avoid:** Register `RolesGuard` in the module's `providers` array, then inject via `@UseGuards(JwtAuthGuard, RolesGuard)` (NestJS resolves it from DI). The admin module (or `AppModule`) must provide `RolesGuard`.
**Warning signs:** All admin routes return 200 regardless of user role (guard short-circuits with `return true` when `requiredRoles` is undefined).

### Pitfall 6: `refreshToken` leaked in /api/auth/me response
**What goes wrong:** `req.user` contains the full User entity (if the JWT strategy is ever changed to do a DB lookup), exposing the stored refresh token hash.
**Why it happens:** Developer returns `req.user` directly without whitelisting fields.
**How to avoid:** `JwtStrategy.validate()` returns a plain object `{ id, email, roles }` — not the full User entity. The `/api/auth/me` handler returns `req.user` which is this safe subset. Never return the full User entity from a JWT-authenticated endpoint.
**Warning signs:** API response includes `refreshToken` field.

---

## Code Examples

### AUTH-01: Updated JwtPayload interface

```typescript
// src/auth/interfaces/jwt-payload.interface.ts
import { UserRole } from '../entities/user.entity';

export interface JwtPayload {
  sub: string;
  email: string;
  roles: UserRole[];
}
```

### AUTH-01: Updated generateTokens()

```typescript
// src/auth/auth.service.ts — generateTokens()
async generateTokens(user: User): Promise<{ accessToken: string; refreshToken: string }> {
  const payload: JwtPayload = {
    sub: user.id,
    email: user.email || '',
    roles: user.roles,  // ADD THIS
  };
  const accessToken = this.jwtService.sign(payload);
  const refreshToken = this.jwtService.sign(
    { ...payload, jti: crypto.randomUUID() },
    {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    },
  );
  await this.updateRefreshToken(user.id, refreshToken);
  return { accessToken, refreshToken };
}
```

### AUTH-01: Updated JwtStrategy.validate()

```typescript
// src/auth/strategies/jwt.strategy.ts
import { UserRole } from '../entities/user.entity';

validate(payload: JwtPayload) {
  return {
    id: payload.sub,
    email: payload.email,
    roles: payload.roles,  // ADD THIS
  };
}
```

### AUTH-02: /api/auth/me endpoint

```typescript
// src/auth/auth.controller.ts — new method
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { UserRole } from './entities/user.entity';

interface JwtUser {
  id: string;
  email: string;
  roles: UserRole[];
}

@Get('me')
@UseGuards(JwtAuthGuard)
getMe(@Req() req: Request & { user: JwtUser }) {
  return {
    id: req.user.id,
    email: req.user.email,
    roles: req.user.roles,
  };
}
```

### AUTH-03: Roles decorator

```typescript
// src/auth/decorators/roles.decorator.ts
import { SetMetadata } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';

export const ROLES_KEY = 'roles';
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);
```

### AUTH-03: RolesGuard

```typescript
// src/auth/guards/roles.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { UserRole } from '../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<{ user: { roles: UserRole[] } }>();
    const hasRole = requiredRoles.some((role) =>
      request.user?.roles?.includes(role),
    );
    if (!hasRole) {
      throw new ForbiddenException('Insufficient permissions');
    }
    return true;
  }
}
```

### AUTH-03: RolesGuard unit test (guard spec file)

```typescript
// src/auth/guards/roles.guard.spec.ts
import { RolesGuard } from './roles.guard';
import { Reflector } from '@nestjs/core';
import { ExecutionContext, ForbiddenException } from '@nestjs/common';
import { UserRole } from '../entities/user.entity';
import { ROLES_KEY } from '../decorators/roles.decorator';

describe('RolesGuard', () => {
  let guard: RolesGuard;
  let reflector: Reflector;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new RolesGuard(reflector);
  });

  const mockContext = (userRoles: UserRole[], requiredRoles: UserRole[]) => {
    jest.spyOn(reflector, 'getAllAndOverride').mockReturnValue(requiredRoles);
    return {
      switchToHttp: () => ({
        getRequest: () => ({ user: { roles: userRoles } }),
      }),
      getHandler: () => jest.fn(),
      getClass: () => jest.fn(),
    } as unknown as ExecutionContext;
  };

  it('allows access when user has required role', () => {
    const ctx = mockContext([UserRole.ADMIN], [UserRole.ADMIN]);
    expect(guard.canActivate(ctx)).toBe(true);
  });

  it('throws ForbiddenException when user lacks required role', () => {
    const ctx = mockContext([UserRole.USER], [UserRole.ADMIN]);
    expect(() => guard.canActivate(ctx)).toThrow(ForbiddenException);
  });

  it('allows access when no roles required', () => {
    const ctx = mockContext([UserRole.USER], []);
    expect(guard.canActivate(ctx)).toBe(true);
  });
});
```

### BRND-01: Updated constants.ts

```typescript
// src/constants.ts — change line 34
export const APP_NAME = "PDFThumb";  // was "PDFThumb.com"
```

### BRND-01: Updated __root.tsx with head management

```tsx
// src/routes/__root.tsx
import { createRootRoute, Outlet, HeadContent } from "@tanstack/react-router";
import Navbar from "../components/Navbar";
import Footer from "../components/Footer";
import { useTheme } from "../hooks/useTheme";
import { AuthProvider } from "../hooks/AuthContext";
import { APP_NAME } from "../constants";

function RootComponent() {
  const [theme, toggleTheme] = useTheme();
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar theme={theme} toggleTheme={toggleTheme} />
      <main className="flex-grow">
        <Outlet />
      </main>
      <Footer />
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { title: APP_NAME },
      { name: "description", content: "Fast, reliable PDF thumbnail generation API for developers." },
      { property: "og:title", content: APP_NAME },
      { property: "og:description", content: "Fast, reliable PDF thumbnail generation API for developers." },
      { property: "og:site_name", content: APP_NAME },
      { property: "og:type", content: "website" },
    ],
  }),
  component: () => (
    <AuthProvider>
      <HeadContent />
      <RootComponent />
    </AuthProvider>
  ),
});
```

---

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `document.title = ...` in useEffect | TanStack Router `head` option + `HeadContent` | TanStack Router v1.x | Route-lifecycle-aware, deduplicates tags, no race conditions |
| `@Roles()` with global `APP_GUARD` | `@Roles()` with per-route `@UseGuards()` chain | Codebase convention | Explicit, readable, matches existing guard application pattern |

**No deprecated approaches apply** to this phase. The `head` API in `@tanstack/react-router@1.132.x` is stable and the documented approach for SPA head management.

---

## Open Questions

1. **Favicon and OG image**
   - What we know: No `public/` directory exists. No favicon or OG image files are present anywhere.
   - What's unclear: Whether BRND-01 success criterion includes creating a favicon, or just the text content (title, meta tags).
   - Recommendation: The CONTEXT.md says "Researcher should audit for visual assets containing outdated names." There are **no existing visual assets to update** — nothing is outdated because nothing exists. BRND-01 is satisfied without creating new image assets in Phase 1. Add a note to `index.html` `<link rel="icon">` pointing to a placeholder if desired, but this is not blocking.

2. **displayName field in /api/auth/me — nullable**
   - What we know: `User.displayName` is `string | null`. Some users may not have a display name (anonymous API key users).
   - What's unclear: Whether Phase 2 frontend needs `displayName` to show in the navbar user pill.
   - Recommendation: Include `displayName` in `/api/auth/me` response. The Navbar already renders `{user?.name || user?.email}` — it falls back gracefully to email.

3. **AdminModule registration**
   - What we know: There is no `admin` module in the codebase yet.
   - What's unclear: Whether to create a minimal `admin.module.ts` or add the placeholder route directly to `AppModule`.
   - Recommendation: Create a minimal `AdminModule` with `AdminController`. Register it in `AppModule`. This is cleaner and follows the existing module-per-domain pattern (`auth`, `api-key`, `subscription`, `thumbnail`). `RolesGuard` can be provided either in `AdminModule` or `CommonModule` — prefer `CommonModule` since it will be reused by Phase 3, 5, 6 admin routes.

---

## Sources

### Primary (HIGH confidence)
- Direct codebase inspection of `/Users/moshu/development/pdfthumbnailpro/pdfthumbnailpro-be/src/` — auth module, guards, entities, strategies, tests
- Direct codebase inspection of `/Users/moshu/development/pdfthumbnailpro/pdfthumb.com/src/` — constants, routes, components
- `@tanstack/react-router` dist source map (HeadContent.js) — `HeadContent` API and `head` option behavior
- `/Users/moshu/development/pdfthumbnailpro/pdfthumb.com/node_modules/@tanstack/react-router/dist/llms/rules/guide.js` — official head management docs

### Secondary (MEDIUM confidence)
- NestJS v11 RBAC guard pattern (standard `Reflector` + `SetMetadata` approach — consistent with NestJS docs and confirmed as matching codebase guard style)

---

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — everything is already installed; no external packages needed
- Architecture: HIGH — direct codebase inspection; no assumptions
- Pitfalls: HIGH — identified from codebase-specific patterns (e.g., `.replace(".com", "")` in Navbar, guard ordering)
- Branding status: HIGH — every relevant file was read directly

**Research date:** 2026-02-18
**Valid until:** 2026-03-20 (stable NestJS v11 + TanStack Router v1.x APIs; branding audit is a point-in-time codebase snapshot)
