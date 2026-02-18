---
phase: 01-auth-backend-branding
plan: 01
subsystem: auth
tags: [jwt, nestjs, rbac, roles, guard, decorator]

# Dependency graph
requires: []
provides:
  - JWT access token payload carries roles: UserRole[] (compile-time enforced via JwtPayload interface)
  - JwtStrategy.validate() returns { id, email, roles } populating req.user for all downstream guards
  - RolesGuard (CanActivate) reads @Roles() metadata via Reflector and throws ForbiddenException on mismatch
  - Roles() decorator and ROLES_KEY constant for per-route role requirements
affects: [01-02, admin-module, any route requiring role-based access]

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "JWT payload as single source of truth for roles — no DB lookup per request"
    - "@UseGuards(JwtAuthGuard, RolesGuard) ordering: JwtAuthGuard always first to populate req.user"
    - "RolesGuard provided per-module (not global APP_GUARD) — applied per-route via @UseGuards()"

key-files:
  created:
    - src/auth/decorators/roles.decorator.ts
    - src/auth/guards/roles.guard.ts
  modified:
    - src/auth/interfaces/jwt-payload.interface.ts
    - src/auth/auth.service.ts
    - src/auth/strategies/jwt.strategy.ts
    - src/auth/strategies/jwt.strategy.spec.ts

key-decisions:
  - "JWT payload is the single source of truth for roles — avoids DB lookup on every request (eventual consistency trade-off accepted)"
  - "RolesGuard not registered as global APP_GUARD — applied per-route to avoid breaking unauthenticated endpoints"
  - "Guard ordering convention: JwtAuthGuard before RolesGuard always — enforced by convention not code"

patterns-established:
  - "Role guard pattern: @UseGuards(JwtAuthGuard, RolesGuard) + @Roles(UserRole.ADMIN) on controller/handler"
  - "req.user shape: { id: string, email: string, roles: UserRole[] } — set by JwtStrategy.validate()"

requirements-completed: [AUTH-01, AUTH-03]

# Metrics
duration: 2min
completed: 2026-02-18
---

# Phase 1 Plan 01: JWT Roles Payload + RolesGuard Infrastructure Summary

**JWT payload extended with roles array and RolesGuard/@Roles() decorator created — RBAC infrastructure ready for wiring in plan 02**

## Performance

- **Duration:** ~2 min
- **Started:** 2026-02-18T19:21:53Z
- **Completed:** 2026-02-18T19:24:06Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments
- Extended `JwtPayload` interface with `roles: UserRole[]`, enforced at compile time
- Updated `generateTokens()` to embed `roles: user.roles` in every issued access token
- Updated `JwtStrategy.validate()` to return `{ id, email, roles }` — populates `req.user` without DB lookup
- Created `RolesGuard` implementing `CanActivate` with `Reflector`-based metadata reading
- Created `@Roles()` decorator and `ROLES_KEY` constant for per-route role requirements

## Task Commits

Each task was committed atomically:

1. **Task 1: Extend JWT payload to include roles (AUTH-01)** - `bc096e3` (feat)
2. **Task 2: Create RolesGuard and @Roles() decorator (AUTH-03)** - `8285c41` (feat)

**Plan metadata:** (docs commit follows)

## Files Created/Modified
- `src/auth/interfaces/jwt-payload.interface.ts` - Added `roles: UserRole[]` field, added UserRole import
- `src/auth/auth.service.ts` - Added `roles: user.roles` to `generateTokens()` JwtPayload object
- `src/auth/strategies/jwt.strategy.ts` - `validate()` now returns `{ id, email, roles }` from payload
- `src/auth/strategies/jwt.strategy.spec.ts` - Fixed mock payload and expected result to include roles
- `src/auth/decorators/roles.decorator.ts` - New file: Roles() decorator and ROLES_KEY constant
- `src/auth/guards/roles.guard.ts` - New file: RolesGuard CanActivate with Reflector + ForbiddenException

## Decisions Made
- JWT payload is the single source of truth for roles — avoids DB lookup on every request. Eventual consistency trade-off: if roles change, the user must re-login or wait for token expiry.
- `RolesGuard` is NOT registered as a global `APP_GUARD` — it must be applied per-route via `@UseGuards()` to avoid breaking unauthenticated public endpoints.
- Guard ordering convention established: `JwtAuthGuard` always before `RolesGuard` so `req.user` is populated when `RolesGuard` runs.

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 1 - Bug] Fixed jwt.strategy.spec.ts mock missing roles field**
- **Found during:** Task 1 (Extend JWT payload)
- **Issue:** After adding `roles: UserRole[]` as required field to `JwtPayload`, the existing spec had `{ sub: string; email: string }` — missing `roles` — causing TypeScript error TS2741
- **Fix:** Added `import { UserRole }` and `roles: [UserRole.USER]` to the mock payload; updated `expect(result).toEqual()` to include `roles`
- **Files modified:** `src/auth/strategies/jwt.strategy.spec.ts`
- **Verification:** `npx tsc --noEmit` shows no auth-related errors after fix
- **Committed in:** `bc096e3` (part of Task 1 commit)

---

**Total deviations:** 1 auto-fixed (Rule 1 - Bug: broken test mock)
**Impact on plan:** Fix was necessary for TypeScript correctness. No scope creep.

## Issues Encountered
- Three pre-existing TypeScript errors in `src/app.module.ts` (sentinel client) and `src/utils/redis.utils.ts` (missing ioredis types) were present before this plan's execution. They are unrelated to auth changes and logged as deferred items.

## User Setup Required
None - no external service configuration required.

## Next Phase Readiness
- Plan 02 (Admin endpoint) can now import `RolesGuard` from `src/auth/guards/roles.guard.ts` and `Roles` from `src/auth/decorators/roles.decorator.ts`
- Pattern to use: `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles(UserRole.ADMIN)` on the admin controller
- `AdminModule` must include `RolesGuard` in its `providers` array for Reflector DI injection

## Self-Check: PASSED

- FOUND: `src/auth/interfaces/jwt-payload.interface.ts`
- FOUND: `src/auth/auth.service.ts`
- FOUND: `src/auth/strategies/jwt.strategy.ts`
- FOUND: `src/auth/decorators/roles.decorator.ts`
- FOUND: `src/auth/guards/roles.guard.ts`
- FOUND: `.planning/phases/01-auth-backend-branding/01-01-SUMMARY.md`
- FOUND: commit `bc096e3` (Task 1)
- FOUND: commit `8285c41` (Task 2)

---
*Phase: 01-auth-backend-branding*
*Completed: 2026-02-18*
