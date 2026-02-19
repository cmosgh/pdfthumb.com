# Roadmap: PDFThumb.io — Stripe Subscriptions + Admin RBAC Milestone

## Overview

PDFThumb.io's existing codebase has auth, dashboard layout, API key management, and analytics UI with mock data already validated. This milestone completes the gap between "working demo" and "production SaaS": real money flows (Stripe), Romanian e-invoicing compliance (Oblio/ANAF), live analytics data, and a role-protected admin section. Every subsequent phase unlocks only after role-aware authentication is in place, so backend RBAC ships first. From there, analytics backend before frontend wiring, and admin backend before admin UI — each phase delivers one independently verifiable capability. Stripe and Romanian invoicing phases follow, ordered to close out payment compliance without blocking earlier user-facing value.

## Phases

**Phase Numbering:**
- Integer phases (1, 2, 3): Planned milestone work
- Decimal phases (2.1, 2.2): Urgent insertions (marked with INSERTED)

Decimal phases appear between their surrounding integers in numeric order.

- [x] **Phase 1: Auth Backend + Branding** - Embed role in JWT, enforce RolesGuard on backend routes, and standardize branding
- [x] **Phase 2: Auth Frontend + Token Refresh** - Propagate role into React context, add router guards, and wire auto-refresh (completed 2026-02-19)
- [ ] **Phase 3: Analytics Backend** - Create usage_events table, tracking interceptor, and analytics API endpoints
- [ ] **Phase 4: Analytics Frontend** - Replace mock data on overview and analytics pages with live backend data
- [ ] **Phase 5: Admin Backend** - Ship paginated user list, per-user API key access, and user suspend endpoints
- [ ] **Phase 6: Admin Frontend** - Build admin dashboard UI, user detail drill-down, plan assignment, and key revocation
- [ ] **Phase 7: Stripe Backend Core** - Expose checkout endpoint, implement all webhook handlers with idempotency, persist customer ID
- [ ] **Phase 8: Stripe Frontend Flows** - Checkout redirect, success/cancel pages, and Manage Billing portal link
- [ ] **Phase 9: Romanian Invoicing** - Oblio e-invoice creation and ANAF SPV submission on every paid checkout

## Phase Details

### Phase 1: Auth Backend + Branding
**Goal**: Backend routes are protected by role and the product presents a consistent brand identity
**Depends on**: Nothing (first phase)
**Requirements**: AUTH-01, AUTH-02, AUTH-03, BRND-01
**Success Criteria** (what must be TRUE):
  1. A decoded JWT issued after login contains a `role` field with value `USER` or `ADMIN`
  2. `GET /api/auth/me` returns the authenticated user's profile including their role
  3. Calling any admin-only backend route with a regular user token returns 403 Forbidden
  4. "PDFThumb.io" appears consistently in the site header, footer, all page titles, and meta tags — no old name variants remain
**Plans**: 3 plans

Plans:
- [x] 01-01-PLAN.md — JWT payload extension + RolesGuard/Roles() infrastructure (Wave 1)
- [x] 01-02-PLAN.md — GET /api/auth/me endpoint + AdminModule placeholder route + RolesGuard unit tests (Wave 2)
- [x] 01-03-PLAN.md — PDFThumb branding overhaul: APP_NAME constant, Navbar cleanup, TanStack Router head API (Wave 1)

### Phase 2: Auth Frontend + Token Refresh
**Goal**: The React app knows the user's role, admin routes are protected client-side, and access tokens refresh automatically before expiration
**Depends on**: Phase 1
**Requirements**: AUTH-04, AUTH-05, AUTH-06
**Success Criteria** (what must be TRUE):
  1. After login, the frontend fetches `/api/auth/me` and the user's role is available in `AuthContext`
  2. Navigating to `/dashboard/admin` as a regular user redirects away; navigating as an admin succeeds
  3. The admin section nav item is visible only when the logged-in user has the `ADMIN` role
  4. A user with a near-expiring access token has it silently refreshed without being logged out or seeing an error
**Plans**: 3 plans

Plans:
- [x] 02-01-PLAN.md — Extend types, add authApi.me(), implement fetchMe() in AuthContext, wire RouterProvider with live auth context (Wave 1)
- [ ] 02-02-PLAN.md — Create pathless _admin route group with beforeLoad role guard; add conditional admin nav item with skeleton (Wave 2)
- [ ] 02-03-PLAN.md — Proactive refresh timer (5min buffer), cross-tab storage sync, session-expired modal (Wave 2)

### Phase 3: Analytics Backend
**Goal**: The backend records thumbnail generation events and exposes aggregated analytics data to authorized callers
**Depends on**: Phase 1
**Requirements**: ANLX-01, ANLX-02, ANLX-03, ANLX-04
**Success Criteria** (what must be TRUE):
  1. Every thumbnail generation request writes a usage event row to `usage_events` without adding latency to the thumbnail response
  2. `GET /api/analytics/summary` returns the authenticated user's own aggregated stats (total calls, errors, duration)
  3. `GET /api/analytics/admin/summary` returns platform-wide aggregate stats and is only accessible to admins (returns 403 to regular users)
**Plans**: TBD

Plans:
- [ ] 03-01: Create `UsageEvent` TypeORM entity and migration for `usage_events` table
- [ ] 03-02: Implement `UsageTrackingInterceptor` applied to `ThumbnailController` with fire-and-forget write
- [ ] 03-03: Implement `AnalyticsModule` with `AnalyticsService` aggregate queries and `GET /api/analytics/summary` + `GET /api/analytics/admin/summary` endpoints

### Phase 4: Analytics Frontend
**Goal**: The overview and analytics dashboard pages display real usage data from the backend
**Depends on**: Phase 3
**Requirements**: ANLX-05, ANLX-06
**Success Criteria** (what must be TRUE):
  1. The overview dashboard page shows the logged-in user's actual PDFs processed, thumbnails generated, API call count, and error rate — no mock values
  2. The analytics detail page charts reflect real data and correctly filter results when the user changes the date range selector
**Plans**: TBD

Plans:
- [ ] 04-01: Add `analyticsApi` object to `src/api.ts` calling `/api/analytics/summary`; replace mock data in `overview.tsx`
- [ ] 04-02: Wire analytics detail page charts to live data with working date range filtering

### Phase 5: Admin Backend
**Goal**: Secure backend endpoints give the admin read/write access to any user's account, keys, and subscription status
**Depends on**: Phase 1, Phase 3
**Requirements**: ADMN-01, ADMN-02, ADMN-03, ADMN-04
**Success Criteria** (what must be TRUE):
  1. `GET /api/admin/users` returns a paginated list of all users including their email, plan, usage, and account status
  2. `GET /api/admin/users/:id/api-keys` returns all API keys belonging to any user when called by an admin
  3. `DELETE /api/admin/api-keys/:id` revokes any user's API key regardless of ownership
  4. `POST /api/admin/users/:id/suspend` blocks a user's API access and a subsequent API key request from that user is rejected
  5. All four endpoints return 403 when called with a non-admin token
**Plans**: TBD

Plans:
- [ ] 05-01: Implement `GET /api/admin/users` with pagination, subscription status, and usage fields
- [ ] 05-02: Implement `GET /api/admin/users/:id/api-keys` and `DELETE /api/admin/api-keys/:id` with admin scope bypass
- [ ] 05-03: Implement `POST /api/admin/users/:id/suspend` endpoint and integrate suspend check into API key auth guard

### Phase 6: Admin Frontend
**Goal**: The admin can view all users, drill into any account, change plans, revoke keys, and suspend users from the dashboard
**Depends on**: Phase 5
**Requirements**: ADMN-05, ADMN-06, ADMN-07, ADMN-08
**Success Criteria** (what must be TRUE):
  1. The admin navigates to `/dashboard/admin` and sees a sortable, searchable table of all users with their subscription plan, usage, and status
  2. The admin clicks a user row and sees that user's API keys listed; clicking revoke removes the key immediately
  3. The admin can change a user's subscription plan from the user detail view and the change is reflected in the user list
  4. The admin can suspend and unsuspend a user from the user detail view; the user list reflects the updated status
**Plans**: TBD

Plans:
- [ ] 06-01: Build admin dashboard page at `/dashboard/admin` with sortable/searchable user list table
- [ ] 06-02: Build user detail drill-down view with API key list and revoke action
- [ ] 06-03: Add plan assignment form and suspend/unsuspend controls to user detail view

### Phase 7: Stripe Backend Core
**Goal**: The backend can accept payments and correctly handle every subscription lifecycle event with idempotent webhook processing
**Depends on**: Phase 1
**Requirements**: PAY-02, PAY-03, PAY-04, PAY-05, PAY-06, PAY-07, PAY-08, PAY-09, PAY-10, PAY-11, PAY-14
**Success Criteria** (what must be TRUE):
  1. `POST /api/payments/checkout` returns a Stripe Checkout session URL for a given plan
  2. When Stripe fires `checkout.session.completed`, the user's subscription is activated in the database
  3. Duplicate Stripe webhook events for the same `event.id` are silently skipped without double-processing
  4. Stripe webhook signature verification succeeds because the raw request body is preserved
  5. `POST /api/payments/portal` returns a Stripe Customer Portal session URL for a logged-in user
  6. EU VAT is automatically calculated on all Stripe transactions (Stripe Tax enabled)
**Plans**: TBD

Plans:
- [ ] 07-01: Enable raw body preservation (`rawBody: true`) and expose `POST /api/payments/checkout` endpoint
- [ ] 07-02: Implement webhook idempotency table and complete `checkout.session.completed` handler
- [ ] 07-03: Implement remaining webhook handlers: `invoice.paid`, `invoice.payment_failed`, `customer.subscription.deleted`, `customer.subscription.updated`
- [ ] 07-04: Persist `stripe_customer_id` on user record; expose `POST /api/payments/portal`; enable Stripe Tax in Dashboard

### Phase 8: Stripe Frontend Flows
**Goal**: Users can select a plan, complete checkout, and manage their billing entirely from the dashboard
**Depends on**: Phase 7
**Requirements**: PAY-01, PAY-12, PAY-13, PAY-15
**Success Criteria** (what must be TRUE):
  1. Clicking a pricing plan button redirects the browser to Stripe's hosted Checkout page
  2. After a successful payment, the `/payment/success` page polls for subscription activation and shows the user their active plan once confirmed
  3. Clicking cancel on the Stripe Checkout page returns the user to the pricing section of the landing page
  4. A logged-in subscriber can click "Manage Billing" and be redirected to the Stripe Customer Portal
**Plans**: TBD

Plans:
- [ ] 08-01: Replace `handleInitiateCheckout()` stub with redirect to Stripe Checkout session URL
- [ ] 08-02: Build `/payment/success` polling page with exponential back-off on subscription status
- [ ] 08-03: Build `/payment/cancel` page that returns user to pricing section; add "Manage Billing" portal link in dashboard settings

### Phase 9: Romanian Invoicing
**Goal**: Every paid subscription generates a compliant Romanian e-invoice submitted to ANAF SPV automatically
**Depends on**: Phase 7
**Requirements**: INVX-01, INVX-02, INVX-03, INVX-04
**Success Criteria** (what must be TRUE):
  1. After a `checkout.session.completed` webhook, an invoice appears in Oblio linked to the buyer
  2. The Oblio invoice is submitted to ANAF SPV (via Oblio's auto-send setting or explicit API call)
  3. Oblio API token is cached in NestJS memory or Redis so the SDK does not re-authenticate on every request
  4. Retrying the same Stripe webhook event does not create a duplicate Oblio invoice (idempotency via Payment Intent ID)
**Plans**: TBD

Plans:
- [ ] 09-01: Integrate `@obliosoftware/oblioapi`; cache Oblio API token in NestJS memory/Redis
- [ ] 09-02: On `checkout.session.completed`, create Oblio invoice using Stripe Payment Intent ID as idempotency key; configure ANAF SPV auto-send

## Progress

**Execution Order:**
Phases execute in numeric order: 1 → 2 → 3 → 4 → 5 → 6 → 7 → 8 → 9

Note: Phase 3 (Analytics BE) depends on Phase 1 completing first. Phase 5 (Admin BE) depends on Phase 1 and Phase 3 — the user list surfaces per-user usage data. Phase 7 (Stripe BE) depends only on Phase 1 and is independent of analytics and admin. Phases 7 and 5/6 can be parallelized after Phase 4 ships if desired.

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Auth Backend + Branding | 3/3 | Complete | 2026-02-18 |
| 2. Auth Frontend + Token Refresh | 3/3 | Complete   | 2026-02-19 |
| 3. Analytics Backend | 0/3 | Not started | - |
| 4. Analytics Frontend | 0/2 | Not started | - |
| 5. Admin Backend | 0/3 | Not started | - |
| 6. Admin Frontend | 0/3 | Not started | - |
| 7. Stripe Backend Core | 0/4 | Not started | - |
| 8. Stripe Frontend Flows | 0/3 | Not started | - |
| 9. Romanian Invoicing | 0/2 | Not started | - |
