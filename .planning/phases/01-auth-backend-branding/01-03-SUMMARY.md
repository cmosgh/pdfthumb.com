---
phase: 01-auth-backend-branding
plan: "03"
subsystem: ui
tags: [react, tanstack-router, branding, seo, meta-tags]

# Dependency graph
requires: []
provides:
  - APP_NAME constant set to "PDFThumb" in src/constants.ts
  - TanStack Router HeadContent wired in __root.tsx for per-route title injection
  - Per-route head() with route-specific page titles on all user-visible routes
  - OG/description meta tags set globally from root route
  - Zero occurrences of "PDFThumb.com" or "PDF Thumbnail API" in frontend source
affects:
  - Phase 2 (auth state may affect page title display — head() extension point established)
  - Any future route additions (pattern established: all routes get head() with title)

# Tech tracking
tech-stack:
  added: []
  patterns:
    - "APP_NAME constant as single source of truth for brand name across all components"
    - "TanStack Router head() API on createRootRoute for global OG/meta defaults"
    - "Per-route head() override pattern: each createFileRoute call includes head() with route-specific title"
    - "HeadContent rendered exactly once in root component (inside AuthProvider)"

key-files:
  created: []
  modified:
    - src/constants.ts
    - src/components/Navbar.tsx
    - src/components/CTASection.tsx
    - src/components/FeaturesSection.tsx
    - src/routes/__root.tsx
    - index.html
    - src/routes/index.tsx
    - src/routes/login.tsx
    - src/routes/dashboard.tsx
    - src/routes/dashboard/overview.tsx
    - src/routes/dashboard/analytics.tsx
    - src/routes/dashboard/settings.tsx

key-decisions:
  - "APP_NAME set to 'PDFThumb' (no TLD) — consistent branding across all surfaces"
  - "HeadContent rendered inside AuthProvider in root component — OG/meta injected client-side, no SSR required"
  - "Root route head() sets global defaults; child routes override with route-specific titles"

patterns-established:
  - "Brand name pattern: import APP_NAME from constants.ts — never hardcode brand string"
  - "Head pattern: every createFileRoute() for user-visible pages includes head() returning meta array with title"

requirements-completed: [BRND-01]

# Metrics
duration: 3min
completed: 2026-02-18
---

# Phase 1 Plan 03: Branding Standardization Summary

**APP_NAME constant fixed to "PDFThumb", TanStack Router HeadContent wired for per-route page titles and OG/description meta tags, all old brand strings removed.**

## Performance

- **Duration:** 3 min
- **Started:** 2026-02-18T19:21:45Z
- **Completed:** 2026-02-18T19:25:26Z
- **Tasks:** 2
- **Files modified:** 12

## Accomplishments

- Fixed `APP_NAME = "PDFThumb"` (was `"PDFThumb.com"`) and removed `.replace(".com", "")` dead code in Navbar mobile span
- Replaced "PDF Thumbnail API" text in CTASection and FeaturesSection with "PDFThumb API"
- Wired `HeadContent` in `__root.tsx` with global default OG/description meta tags
- Added per-route `head()` with route-specific page titles to all 7 user-visible routes

## Task Commits

Each task was committed atomically:

1. **Task 1: Fix APP_NAME constant and remove dead brand strings** - `1485b55` (feat)
2. **Task 2: Wire TanStack Router head API with per-route page titles** - `68bcfcb` (feat)

**Plan metadata:** (docs commit below)

## Files Created/Modified

- `src/constants.ts` - APP_NAME changed from "PDFThumb.com" to "PDFThumb"
- `src/components/Navbar.tsx` - Removed `.replace(".com", "")` dead code from mobile brand span
- `src/components/CTASection.tsx` - "PDF Thumbnail API" replaced with "PDFThumb API"
- `src/components/FeaturesSection.tsx` - "PDF Thumbnail API" replaced with "PDFThumb API"
- `src/routes/__root.tsx` - Added HeadContent import + render, added head() with global OG/description/title defaults, imported APP_NAME
- `index.html` - Static fallback title changed from "PDF Thumbnail API" to "PDFThumb"
- `src/routes/index.tsx` - Added head() with title "PDFThumb — Fast PDF Thumbnails", imported APP_NAME
- `src/routes/login.tsx` - Added head() with title "Sign In | PDFThumb", imported APP_NAME
- `src/routes/dashboard.tsx` - Added head() with title "Dashboard | PDFThumb", imported APP_NAME
- `src/routes/dashboard/overview.tsx` - Added head() with title "Overview | PDFThumb", imported APP_NAME
- `src/routes/dashboard/analytics.tsx` - Added head() with title "Analytics | PDFThumb", imported APP_NAME
- `src/routes/dashboard/settings.tsx` - Added head() with title "Settings | PDFThumb", imported APP_NAME

## Decisions Made

- `HeadContent` rendered inside `AuthProvider` in the root component — keeps head injection co-located with auth context, no SSR required
- Root route `head()` establishes global OG defaults; child routes override only `title` — avoids duplication

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

Pre-existing TypeScript errors in `vitest.config.ts` (missing vitest/config and @vitejs/plugin-react type declarations) were present before this plan and are out of scope. All modified files compile cleanly.

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- BRND-01 complete — "PDFThumb" branding is consistent across the entire frontend
- `head()` extension point established in all routes — Phase 2 can extend these to include auth-aware title variants
- No blockers for subsequent plans in Phase 1

---
*Phase: 01-auth-backend-branding*
*Completed: 2026-02-18*
