# Requirements: PDFThumb.io

**Defined:** 2026-02-18
**Core Value:** Users can get a working API key and start generating PDF thumbnails in under 5 minutes — the portal must make that path frictionless.

## v1 Requirements

### Auth & RBAC

- [ ] **AUTH-01**: JWT access token includes user's `role` field (UserRole.USER / ADMIN)
- [ ] **AUTH-02**: `GET /api/auth/me` returns authenticated user's profile including role
- [ ] **AUTH-03**: NestJS `RolesGuard` + `@Roles()` decorator enforce backend admin routes
- [ ] **AUTH-04**: Frontend fetches role from `/api/auth/me` after login and stores in AuthContext
- [ ] **AUTH-05**: Admin sidebar section and `/dashboard/admin` route only visible/accessible to admins (TanStack Router `beforeLoad` guard)
- [ ] **AUTH-06**: Access token auto-refreshes before expiration (not just on-demand)

### Payments

- [ ] **PAY-01**: User can select a plan and be redirected to Stripe hosted Checkout
- [ ] **PAY-02**: `POST /api/payments/checkout` creates Stripe session and returns redirect URL
- [ ] **PAY-03**: Stripe webhook handler processes `checkout.session.completed` → activates subscription
- [ ] **PAY-04**: Stripe webhook handler processes `invoice.paid` → renews subscription
- [ ] **PAY-05**: Stripe webhook handler processes `invoice.payment_failed` → marks subscription past_due
- [ ] **PAY-06**: Stripe webhook handler processes `customer.subscription.deleted` → deactivates subscription
- [ ] **PAY-07**: Stripe webhook handler processes `customer.subscription.updated` → updates plan details
- [ ] **PAY-08**: Webhook processing is idempotent (Stripe event ID stored, duplicate events ignored)
- [ ] **PAY-09**: NestJS preserves raw request body for Stripe webhook signature verification
- [ ] **PAY-10**: Stripe customer ID persisted on user record after first checkout
- [ ] **PAY-11**: Stripe Tax enabled with automatic EU VAT calculation on all transactions
- [ ] **PAY-12**: `/payment/success` page polls for subscription activation with exponential back-off
- [ ] **PAY-13**: `/payment/cancel` page returns user to pricing section
- [ ] **PAY-14**: `POST /api/payments/portal` creates Stripe Customer Portal session
- [ ] **PAY-15**: "Manage Billing" link in dashboard settings opens Stripe Customer Portal

### Romanian Invoicing (Oblio)

- [ ] **INVX-01**: After `checkout.session.completed`, create a Romanian invoice in Oblio via `@obliosoftware/oblioapi`
- [ ] **INVX-02**: Oblio invoice submitted to ANAF SPV (via Oblio auto-send setting or API call)
- [ ] **INVX-03**: Oblio API token cached in-memory/Redis in NestJS (not file-based SDK default)
- [ ] **INVX-04**: Stripe Payment Intent ID used as Oblio idempotency key (safe on webhook retries)

### Analytics Data

- [ ] **ANLX-01**: `usage_events` table records each thumbnail generation (userId, eventType, isError, durationMs, createdAt)
- [ ] **ANLX-02**: `UsageTrackingInterceptor` on `ThumbnailController` writes events fire-and-forget (does not block thumbnail API response)
- [ ] **ANLX-03**: `GET /api/analytics/summary` returns authenticated user's own aggregated stats
- [ ] **ANLX-04**: `GET /api/analytics/admin/summary` returns platform-wide aggregate stats (admin-only)
- [ ] **ANLX-05**: Overview dashboard page displays real data from `/api/analytics/summary`
- [ ] **ANLX-06**: Analytics detail page charts display real data with working date range filtering

### Admin Section

- [ ] **ADMN-01**: `GET /api/admin/users` returns paginated user list with email, plan, currentMonthlyUsage, status
- [ ] **ADMN-02**: `GET /api/admin/users/:id/api-keys` returns all API keys for any user (admin scope bypass)
- [ ] **ADMN-03**: `DELETE /api/admin/api-keys/:id` revokes any user's API key (admin scope)
- [ ] **ADMN-04**: `POST /api/admin/users/:id/suspend` suspends a user (blocks API access)
- [ ] **ADMN-05**: Admin dashboard page shows sortable/searchable user list with subscription status and usage
- [ ] **ADMN-06**: Admin can drill into a user and change their subscription plan
- [ ] **ADMN-07**: Admin can view and revoke a specific user's API keys from user detail view
- [ ] **ADMN-08**: Admin can suspend/unsuspend a user from user detail view

### Branding

- [ ] **BRND-01**: "PDFThumb.io" used consistently across all pages (header, footer, page titles, meta tags)

## v2 Requirements

### Admin Extensions

- **ADMN-V2-01**: Platform-wide usage summary cards (aggregate across all users)
- **ADMN-V2-02**: Top-N users by usage table
- **ADMN-V2-03**: Recent sign-ups filter/view

### Auth

- **AUTH-V2-01**: GitHub OAuth login (strategy exists in BE, no routes wired yet)

### Notifications

- **NOTF-V2-01**: Email notifications for usage limit warnings
- **NOTF-V2-02**: Admin can send email to a user from user detail view

## Out of Scope

| Feature | Reason |
|---------|--------|
| Audit log | Only valuable with multiple admins; defer to v2+ |
| User impersonation | High security surface, near-zero value for a PDF API; manual support is sufficient |
| Bulk user operations | Revisit at 500+ users |
| Custom analytics (cohort, funnel, LTV) | Use Metabase on production DB; never build in admin panel |
| Mobile app | Web-first; mobile later |
| Activity log page | UI planned but not needed for launch |
| Unit/component tests | Playwright E2E is sufficient for launch pace |
| Email-from-admin | Disproportionate effort for sub-100-user base; use manual email |

## Traceability

_Populated during roadmap creation._

| Requirement | Phase | Status |
|-------------|-------|--------|
| AUTH-01 | — | Pending |
| AUTH-02 | — | Pending |
| AUTH-03 | — | Pending |
| AUTH-04 | — | Pending |
| AUTH-05 | — | Pending |
| AUTH-06 | — | Pending |
| PAY-01 | — | Pending |
| PAY-02 | — | Pending |
| PAY-03 | — | Pending |
| PAY-04 | — | Pending |
| PAY-05 | — | Pending |
| PAY-06 | — | Pending |
| PAY-07 | — | Pending |
| PAY-08 | — | Pending |
| PAY-09 | — | Pending |
| PAY-10 | — | Pending |
| PAY-11 | — | Pending |
| PAY-12 | — | Pending |
| PAY-13 | — | Pending |
| PAY-14 | — | Pending |
| PAY-15 | — | Pending |
| INVX-01 | — | Pending |
| INVX-02 | — | Pending |
| INVX-03 | — | Pending |
| INVX-04 | — | Pending |
| ANLX-01 | — | Pending |
| ANLX-02 | — | Pending |
| ANLX-03 | — | Pending |
| ANLX-04 | — | Pending |
| ANLX-05 | — | Pending |
| ANLX-06 | — | Pending |
| ADMN-01 | — | Pending |
| ADMN-02 | — | Pending |
| ADMN-03 | — | Pending |
| ADMN-04 | — | Pending |
| ADMN-05 | — | Pending |
| ADMN-06 | — | Pending |
| ADMN-07 | — | Pending |
| ADMN-08 | — | Pending |
| BRND-01 | — | Pending |

**Coverage:**
- v1 requirements: 39 total
- Mapped to phases: 0 (pending roadmap)
- Unmapped: 39 ⚠️

---
*Requirements defined: 2026-02-18*
*Last updated: 2026-02-18 after initial definition*
