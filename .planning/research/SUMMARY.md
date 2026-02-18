# Project Research Summary

**Project:** PDFThumb.io — Stripe Subscriptions + Admin RBAC Milestone
**Domain:** SaaS API billing (Stripe/Romania/EU) + internal admin dashboard
**Researched:** 2026-02-18
**Confidence:** HIGH (stack, architecture, pitfalls); MEDIUM (features, e-invoicing specifics)

## Executive Summary

PDFThumb.io is a developer-facing PDF thumbnail generation API with an existing NestJS + React SPA codebase. The current milestone covers two parallel streams: (1) completing Stripe subscription billing so the product can take real money, and (2) building a role-protected admin section so the single operator can manage users and respond to production issues. Both streams are partially scaffolded in the codebase — Stripe SDK is installed but the checkout flow is a stub, and admin role infrastructure exists in the database but is not enforced anywhere.

The recommended approach is to treat Stripe billing and admin RBAC as a single milestone because they share a critical dependency: both require role-aware authentication. The backend must embed `UserRole` in the JWT payload and ship a `RolesGuard` before either the payment provisioning logic or the admin routes can be safely built. Once that foundation is in place, Stripe Checkout and the admin user management surface can be developed in parallel. Stripe's hosted Checkout and Customer Portal handle all PCI, SCA/3DS, and EU payment method complexity without custom UI — the actual billing work is primarily webhook handler correctness and EU VAT configuration, not payment form engineering.

The dominant risks are not technical complexity — the patterns are well-documented — but rather correctness traps that only surface under specific conditions: raw body destruction breaking webhook signature verification, checkout redirect race conditions causing access provisioning failures, non-idempotent webhook handlers sending duplicate emails, and frontend-only admin guards leaving backend routes completely open. All six critical pitfalls have clear preventions that must be designed in from day one, not retrofitted. Romania's mandatory RO e-Factura compliance and EU VAT obligations add a compliance layer that Stripe Tax and a third-party Stripe Marketplace app handle without application code changes, but both must be enabled before the first live transaction.

## Key Findings

### Recommended Stack

The existing Stripe SDK (`stripe@^17`, API version `2025-08-27.basil`) is current and should not be replaced. Paddle and Lemon Squeezy offer no benefit over Stripe for this codebase: Paddle costs 3-4x more in transaction fees, and Lemon Squeezy was acquired by Stripe in July 2024 with an uncertain roadmap. The frontend needs `@stripe/react-stripe-js@^3.x` and `@stripe/stripe-js@^5.x` installed, but the checkout implementation should use a redirect to Stripe's hosted page — not Stripe Elements — to automatically handle SCA/3DS and EU payment methods.

**Core technologies:**
- **Stripe Billing** (`stripe@^17`, already installed) — subscription lifecycle; already scaffolded, needs completion
- **Stripe Tax** (Dashboard-level enablement) — automatic EU VAT calculation, OSS reporting, B2B reverse charge; must be enabled before first live transaction
- **Stripe Checkout (hosted redirect)** — PCI-compliant payment UI; use `window.location.href = session.url`, not the removed `redirectToCheckout()` method (removed Sept 2025)
- **Stripe Customer Portal** — self-service billing management (card updates, invoice download, cancellation); near-zero-code endpoint
- **RO e-Factura Stripe App** (Stripe Marketplace, ~€20/month) — mandatory ANAF RO e-Factura submission for Romanian invoices; handles compliance without touching application code
- **@golevelup/nestjs-stripe** (optional) — reduces NestJS webhook handler boilerplate via decorators

### Expected Features

See `.planning/research/FEATURES.md` for the full feature matrix. Summary:

**Must have (table stakes for launch):**
- RBAC enforcement on admin routes — both NestJS `RolesGuard` backend and TanStack Router `beforeLoad` frontend; without this, all admin routes are accessible to any authenticated user
- User list with subscription status — searchable/sortable table; this is the admin's primary working surface (new `GET /api/admin/users` endpoint required)
- Manual plan assignment — reuses existing `POST /api/users/:userId/subscription` endpoint; needs admin scope guard added
- Per-user API key list with revoke — existing endpoints need admin bypass; cross-user view required
- User suspend/disable — the only table-stakes feature requiring a new backend endpoint (`POST /api/admin/users/:userId/suspend`); no current implementation

**Should have (add when first operational need arises):**
- Platform-wide usage summary cards — requires new aggregate endpoint; add when at-a-glance health matters
- Top-N users by usage — sort user list by `currentMonthlyUsage`; low effort once user list exists
- Recent sign-ups filter — useful when tracking growth rate actively

**Defer (v2+):**
- Email notifications from admin — disproportionate effort for sub-100-user base; use manual email
- User impersonation — high security surface, low value for a PDF API where issues are API key/plan limit problems
- Audit log — only valuable with multiple admins or enterprise SOC 2 requirement
- Bulk operations — revisit at 500+ users
- Custom analytics (cohort, funnel, LTV) — use Metabase pointed at production DB, never build in admin panel

### Architecture Approach

The architecture is an additive layer on the existing system. Three major additions are required: (1) RBAC plumbing — embedding `UserRole` in JWT, adding `RolesGuard` and `@Roles()` decorator, adding `GET /api/auth/me` endpoint, and propagating role into TanStack Router context for `beforeLoad` guards; (2) an `AnalyticsModule` with a `usage_events` TypeORM entity and a `UsageTrackingInterceptor` that fires after the response to record per-request events without blocking thumbnail generation; (3) admin API endpoints scoped to `UserRole.ADMIN`. The current `ApiKeyAuthGuard` used as an admin proxy must be replaced — API keys are credential-scoped, not role-scoped, and any leaked key could reach admin routes.

**Major components:**
1. **JWT + RolesGuard (backend)** — add `role` to JWT payload in `generateTokens()`; new `RolesGuard` reads `@Roles()` metadata via NestJS `Reflector`; must run after `JwtAuthGuard` to avoid `undefined` on `request.user`
2. **AnalyticsModule (backend)** — `UsageEvent` entity (new `usage_events` table) + `AnalyticsService` with aggregate queries + `UsageTrackingInterceptor` applied to `ThumbnailController`; fire-and-forget write, never blocks response path
3. **Admin API endpoints (backend)** — `GET /api/admin/users`, `GET /api/admin/users/:id/api-keys`, `POST /api/admin/users/:id/suspend`, all guarded with `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)`
4. **Stripe webhook handler (backend)** — complete switch on `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`; idempotency table on `event.id`; raw body preserved via `rawBody: true` in `NestFactory.create()`
5. **Role-aware AuthContext + router guards (frontend)** — `GET /api/auth/me` called after login; role stored in `User` type and `AuthContext`; `_admin` pathless route group with `beforeLoad` redirect for non-admins
6. **Stripe Checkout + Portal flow (frontend)** — replace `handleInitiateCheckout()` stub with redirect to hosted Checkout URL; add `/payment/success` polling page; add "Manage Billing" portal link in dashboard

### Critical Pitfalls

See `.planning/research/PITFALLS.md` for the full list. Top 6:

1. **Raw body destroyed before Stripe signature verification** — Set `rawBody: true` in `NestFactory.create()` and pass `req.rawBody` to `stripe.webhooks.constructEvent()`; this must be in place before writing any webhook handler code
2. **Checkout redirect race condition / access provisioned without payment confirmation** — Never provision from the success redirect URL alone; provision only from `checkout.session.completed` webhook; success page should poll `/subscription/status` with exponential back-off
3. **Non-idempotent webhook handlers** — Store processed `event.id` in a DB table with unique constraint before processing; check on every incoming event; wrap insert and business logic in a DB transaction
4. **Frontend-only admin route protection** — Add `@UseGuards(JwtAuthGuard, RolesGuard) @Roles(UserRole.ADMIN)` to every admin NestJS route; the React `beforeLoad` guard is UX, not security
5. **Guard execution order: RolesGuard before JwtAuthGuard** — Always apply `@UseGuards(JwtAuthGuard, RolesGuard)` together at controller or method level; never register `RolesGuard` globally without `JwtAuthGuard` also being global
6. **Missing critical Stripe subscription event handlers** — Implement all 5 webhook events from day one: `checkout.session.completed`, `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`; stubbing only the happy path is insufficient for production

## Implications for Roadmap

Based on research, the build order has clear technical dependencies that dictate phase structure. The RBAC plumbing is the single prerequisite that unlocks everything else.

### Phase 1: RBAC Foundation
**Rationale:** Every subsequent feature — Stripe provisioning, admin routes, analytics endpoints — requires role-aware authentication. This is the unblocking dependency for the entire milestone. It is also entirely self-contained: no UI, no Stripe, no new tables.
**Delivers:** Role in JWT, `RolesGuard`, `@Roles()` decorator, `GET /api/auth/me`, role in `User` type on frontend, role in `RouterContext`, `_admin` pathless route with `beforeLoad` guard, conditional admin nav item in sidebar.
**Addresses:** FEATURES.md — "RBAC enforcement: admin-only routes" (P1)
**Avoids:** PITFALLS.md — Pitfall 4 (frontend-only guard), Pitfall 5 (guard execution order)

### Phase 2: Stripe Checkout + Billing Core
**Rationale:** The product cannot take real money until the complete subscription lifecycle works end-to-end. This is the revenue-critical phase. Must be built after Phase 1 because webhook provisioning writes to `users` table with subscription status that the admin section will later read.
**Delivers:** Exposed `POST /api/payments/checkout` endpoint, complete webhook switch handler (all 5 events), idempotency table, raw body middleware, `stripe_customer_id` persisted on user record, `POST /api/payments/portal` endpoint, Stripe Tax enabled, `/payment/success` polling page, "Manage Billing" link in frontend dashboard.
**Uses:** STACK.md — Stripe Billing, Stripe Tax, Stripe Checkout (hosted), Stripe Customer Portal
**Implements:** Architecture component 4 (Stripe webhook handler) + Architecture component 6 (Stripe Checkout + Portal frontend flow)
**Avoids:** PITFALLS.md — Pitfall 1 (raw body), Pitfall 2 (race condition), Pitfall 3 (idempotency), Pitfall 6 (missing event handlers), Pitfall 7 (test keys in production), Pitfall 9 (missing customer ID), Pitfall 11 (EU VAT), Pitfall 12 (no customer portal)

### Phase 3: Analytics Infrastructure
**Rationale:** The dashboard currently runs on mock data. Converting it to real data requires a new `usage_events` table and analytics endpoints. This phase is independent of admin UI but provides the usage data that admin views consume. Build after Stripe so that real subscription events start generating real data before the admin UI exists to display it.
**Delivers:** `UsageEvent` entity + TypeORM migration, `AnalyticsModule` with service + controller, `UsageTrackingInterceptor` on `ThumbnailController`, `GET /api/analytics/summary` (user-scoped), `GET /api/analytics/admin/summary` (admin-scoped), `analyticsApi` object in `src/api.ts`, replaced mock data in `overview.tsx` and `analytics.tsx`.
**Implements:** Architecture component 2 (AnalyticsModule)
**Avoids:** PITFALLS.md — Anti-Pattern 3 (blocking response to write analytics), Anti-Pattern 5 (analytics logic in thumbnail controller)

### Phase 4: Admin User Management
**Rationale:** Built last because it depends on all prior phases: RBAC guards (Phase 1), subscription status data from Stripe webhooks (Phase 2), and usage data from analytics (Phase 3). The admin section is read-only without these foundations in place.
**Delivers:** `GET /api/admin/users` (paginated user list with subscription status), `GET /api/admin/users/:id/api-keys`, `DELETE /api/admin/api-keys/:id` (admin bypass), `POST /api/admin/users/:id/suspend`, admin dashboard page at `/dashboard/admin`, user detail drill-down, plan assignment form, key revoke action.
**Addresses:** FEATURES.md — all P1 admin features (user list, manual plan assignment, per-user API key list + revoke, user suspend)
**Avoids:** PITFALLS.md — Pitfall 10 (PII leakage in admin responses), Pitfall 16 (role self-promotion via PATCH)

### Phase Ordering Rationale

- RBAC must come first because all other phases have admin-only routes; shipping any route without the guard in place creates a window of exposure
- Stripe Checkout comes second because it is revenue-critical and must be validated in live mode before the admin section is needed (you need paying users before you need an admin view of them)
- Analytics infrastructure precedes admin UI because the admin user list will surface per-user usage data; building analytics after admin would require revisiting admin routes to wire in real data
- Admin UI comes last as the integrating layer that reads from all other subsystems

### Research Flags

Phases needing deeper research during planning:
- **Phase 2 (Stripe Checkout):** RO e-Factura Stripe App pricing and exact scope for B2C international invoices was MEDIUM confidence (third-party tool, JS-only pages); verify current pricing and exact invoice categories covered before configuring. Also verify current Stripe Romania pricing at stripe.com/en-ro/pricing.
- **Phase 2 (Stripe Checkout):** EU OSS registration timing — confirm the €10,000 cross-border B2C threshold calculation with a Romanian accountant before first live international sales.

Phases with standard patterns (skip research-phase):
- **Phase 1 (RBAC Foundation):** NestJS `RolesGuard` + TanStack Router `beforeLoad` are official documented patterns with verified code examples; no novel complexity.
- **Phase 3 (Analytics):** TypeORM entity + NestJS interceptor fire-and-forget pattern is well-documented; at PDFThumb's current scale, no queue or time-series DB is needed.
- **Phase 4 (Admin UI):** Standard CRUD admin pattern on top of existing endpoints; no novel integration.

## Confidence Assessment

| Area | Confidence | Notes |
|------|------------|-------|
| Stack | HIGH | Stripe SDK already installed; official Stripe docs verified; `redirectToCheckout` removal confirmed via official changelog |
| Features | MEDIUM | Core categories verified against SaaS admin references; priority weighting is pattern-based inference for single-admin launch context |
| Architecture | HIGH | Verified against live codebase file reads + official NestJS docs + official TanStack Router docs; build order based on actual dependency graph |
| Pitfalls | HIGH | All 6 critical pitfalls sourced from official docs or confirmed GitHub issues; NestJS guard ordering from confirmed issue #5598 |

**Overall confidence:** HIGH for technical implementation decisions; MEDIUM for Romania-specific compliance specifics (e-invoicing scope, OSS threshold timing)

### Gaps to Address

- **RO e-Factura scope for B2C international invoices:** Research source (stripe-efactura.ro) had MEDIUM confidence; verify the exact invoice categories in scope before enabling the Stripe App and before the first international live transaction. A Romanian accountant or ANAF consultation is the definitive source.
- **Stripe Tax activation sequence:** The exact Dashboard steps for enabling Stripe Tax in Romania (product tax code selection, business address configuration) were described in docs but not tested against the actual account; execute these steps in a test environment first.
- **`currentMonthlyUsage` reset logic:** The existing `SubscriptionGuard` increments `currentMonthlyUsage` but the research did not confirm whether a monthly reset job exists in the codebase. Phase 2 webhook handlers reset this counter on `invoice.paid`; verify the reset logic is correct during implementation.
- **Subscription status field:** STACK.md identifies the need for a `status` field on the user/subscription entity mapping Stripe states; confirm current schema and migration strategy during Phase 2 planning.

## Sources

### Primary (HIGH confidence)
- Stripe Billing docs — subscription lifecycle, webhook events, access provisioning strategy
- Stripe Tax EU documentation — EU VAT calculation, OSS, B2B reverse charge, Romania support
- Stripe Changelog 2025-09-30 — `redirectToCheckout` removal confirmed
- NestJS Guards official docs — RBAC with `Reflector.getAllAndOverride`
- nestjs/nest GitHub issue #5598 — guard execution order confirmed behavior
- TanStack Router RBAC docs — `beforeLoad` + pathless route groups
- Existing codebase (direct file reads) — UserRole enum, JWT payload interface, subscription entity, frontend User type, AuthContext

### Secondary (MEDIUM confidence)
- stripe-efactura.ro — RO e-Factura Stripe App pricing and scope (third-party tool, JS-only pages)
- Romania e-invoicing reform 2025 (globalvatcompliance.com) — B2C scope from January 2025
- Legal requirements for digital services Romania (theromanianlawyers.com) — VAT thresholds, ANAF
- NestJS Stripe webhooks raw body (community blog) — `rawBody: true` configuration
- SaasRock Admin Portal docs — common admin module patterns for feature comparison

### Tertiary (LOW confidence)
- Paddle vs Stripe MoR comparison (unibee.dev) — used for alternatives section only; single source
- Indie Hackers admin dashboard discussion — community opinion on admin scope decisions

---
*Research completed: 2026-02-18*
*Ready for roadmap: yes*
