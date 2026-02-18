# Phase 1: Auth Backend + Branding - Context

**Gathered:** 2026-02-18
**Status:** Ready for planning

<domain>
## Phase Boundary

Backend routes protected by role (JWT `role` field + `RolesGuard` + `@Roles()` decorator) and consistent "PDFThumb" branding across the site. Frontend role propagation, token refresh, and route guards are Phase 2. Admin-specific routes (analytics/admin, admin/users) are built in Phases 3 and 5.

Note: The ROADMAP.md references "PDFThumb.io" in success criteria, but the canonical brand name is **PDFThumb** (no TLD) — the domain is pdfthumb.com. All branding work targets "PDFThumb".

</domain>

<decisions>
## Implementation Decisions

### Role invalidation policy
- Role changes are rare manual ops — no user-facing flow triggers them
- No existing token blacklist or revocation mechanism in the codebase
- Claude's discretion: choose between eventual consistency (trust JWT claim until expiry) vs. re-fetching role from DB per request, informed by what token expiry is currently configured to
- Researcher should check current access token expiry configuration to inform this choice

### /api/auth/me endpoint
- New endpoint — does not currently exist
- Response shape: minimal — `id`, `email`, `role` at minimum; researcher should inspect the existing `User` entity and include any additional fields already present that make sense to expose
- Auth method: researcher should match the pattern used by other existing protected routes (Bearer JWT or cookie — check the codebase)
- Error behavior: 401 for expired/invalid token — standard, handled by existing auth guard

### Admin route guard scope
- `RolesGuard` and `@Roles()` decorator ship in Phase 1 as infrastructure; they are applied to admin routes in the phases where those routes are built (Phases 3, 5, 6)
- Phase 1 must add at least one admin-guarded route to the backend repo (to satisfy the Phase 1 success criterion of verifying 403 behavior) — a minimal route is acceptable
- An automated test (unit or e2e) must verify that a non-admin token receives 403 on the admin route
- RolesGuard application strategy (global APP_GUARD vs. per-route decorator): researcher should check how the existing `JwtAuthGuard` is applied and match that pattern
- Role enum values: researcher should check the existing `User` entity/DB schema for what role values are already defined or stored

### Branding
- Canonical brand name: **PDFThumb** (no TLD)
- Required locations: site header, footer, all page `<title>` tags, meta tags (description, OG tags)
- Success criterion: no old name variants remain anywhere in the codebase
- Researcher should audit for visual assets (favicon, OG image, logo files) containing outdated names or branding
- Researcher should determine whether branding is centralized (config/constants file) or scattered across components — inform the planner so the plan uses the right approach

### Claude's Discretion
- Exact role invalidation strategy (eventual consistency vs. per-request DB lookup) — decide based on discovered token expiry duration
- Exact response fields for `/api/auth/me` beyond `id`, `email`, `role` — match what the User entity already exposes
- RolesGuard application pattern — match existing guard conventions

</decisions>

<specifics>
## Specific Ideas

- The `/api/auth/me` endpoint is a new contract that Phase 2 (frontend) will consume directly — design its shape with that downstream use in mind
- The admin route added for guard verification in Phase 1 can be a placeholder; it will be replaced or supplemented by real admin routes in Phases 5 and 6

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope.

</deferred>

---

*Phase: 01-auth-backend-branding*
*Context gathered: 2026-02-18*
