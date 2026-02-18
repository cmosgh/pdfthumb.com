# Pitfalls Research

**Domain:** Stripe subscription billing + admin RBAC on a SaaS API portal (React SPA + NestJS backend)
**Researched:** 2026-02-18
**Confidence:** HIGH (Stripe pitfalls verified against official docs; NestJS pitfalls verified against official docs and multiple community sources; EU/Romania pitfalls verified against Stripe and legal sources)

---

## Critical Pitfalls

### Pitfall 1: Raw Body Destroyed Before Stripe Signature Verification

**What goes wrong:**
NestJS registers `body-parser` (express.json()) by default before any route handler runs. Stripe's `constructEvent()` requires the **original raw bytes** to verify the `Stripe-Signature` header HMAC. By the time your webhook handler receives the request, the body is a parsed JavaScript object — signature verification throws `Webhook payload must be provided as a string or a Buffer`. The endpoint responds 400, Stripe retries, your subscription never activates.

**Why it happens:**
Developers follow generic NestJS tutorials that don't mention the raw-body requirement. The error only surfaces at webhook-test time, not during `createCheckoutSession`, so the stub code already in the project will compile and appear to work until Stripe sends a real event.

**How to avoid:**
Set `rawBody: true` in `NestFactory.create()`:
```typescript
const app = await NestFactory.create(AppModule, { rawBody: true });
```
Then inject `RawBodyRequest` in the webhook controller and pass `req.rawBody` to `stripe.webhooks.constructEvent()`. Do NOT use `Buffer.from(JSON.stringify(body))` — that re-serializes and will still fail on Unicode edge cases.

**Warning signs:**
- `WebhookSignatureVerificationError` in logs when testing with Stripe CLI
- Webhook endpoint returning 400 on every event
- Stripe Dashboard shows all webhook deliveries as failed

**Phase to address:**
Stripe Checkout phase — must be correct before the first webhook handler is written, not retrofitted after.

---

### Pitfall 2: Provisioning Access on Checkout Success Redirect (Race Condition)

**What goes wrong:**
The frontend redirects to a `?success=true` URL after Stripe Checkout and immediately calls `GET /subscription/status`. The webhook (`checkout.session.completed`) has not arrived yet — the DB still shows no active subscription. User sees "payment failed" or a blank state. Alternatively, some implementations grant access on redirect alone without waiting for webhook confirmation — then a card decline that happens after redirect (3DS failure, etc.) gives free access.

**Why it happens:**
Stripe Checkout redirects the user synchronously, but fires webhooks asynchronously (typically 1–30 seconds later, sometimes longer). Developers assume "redirect = payment succeeded". It does not — a redirect only means the session was completed; actual charge confirmation comes via webhook.

**How to avoid:**
- **Never provision from the redirect URL alone.** Provision only from `checkout.session.completed` webhook.
- On the success page, poll `GET /subscription/status` with exponential back-off (3 attempts, 2s apart) to handle the webhook delay gracefully.
- Alternatively, when the user lands on success, call a backend endpoint that synchronously queries the Stripe API (`stripe.checkout.sessions.retrieve(sessionId)`) to confirm `payment_status: 'paid'` before updating the DB — then the webhook becomes an idempotent no-op.

**Warning signs:**
- Users reporting "I paid but still see the free plan"
- Subscription activated in DB but `invoice.paid` webhook never processed
- Success page shows error to ~5% of users on slow connections

**Phase to address:**
Stripe Checkout phase — the success-page flow and webhook handler must be designed together from the start.

---

### Pitfall 3: Webhook Handler Not Idempotent — Duplicate Events Cause Double Processing

**What goes wrong:**
Stripe retries webhooks for up to 3 days with exponential backoff when your endpoint returns anything other than 2xx. Network blips, deploy restarts, or slow DB writes mean the same `invoice.paid` event arrives twice. A non-idempotent handler sends two activation emails, double-credits usage, or creates two subscription rows.

**Why it happens:**
Developers write `if (status !== 'active') { activate() }` — which is idempotent for status updates — but forget about side effects: email sends, credit grants, audit log entries, third-party API calls.

**How to avoid:**
- Store processed `event.id` (format: `evt_XXXXXXX`) in a DB table with a unique constraint before processing.
- Check that table on every incoming event: skip if already processed.
- Wrap the event ID insert and the business logic in a DB transaction.
- Return 200 immediately after signature verification; process asynchronously in a queue (BullMQ/Redis) if processing takes >5 seconds.

**Warning signs:**
- Duplicate activation emails in production
- `unique constraint violation` errors in DB logs
- Stripe Dashboard showing events marked "Failed" followed by later "Succeeded" for same event

**Phase to address:**
Stripe Checkout phase — the idempotency table must be created as part of the webhook handler implementation, not added as a hotfix.

---

### Pitfall 4: Frontend-Only Admin Route Protection (Security Theater)

**What goes wrong:**
A `<ProtectedRoute role="admin">` wrapper in React prevents the admin UI from rendering for non-admin users. But the backend NestJS endpoints (`GET /admin/users`, `DELETE /admin/users/:id`, etc.) have no guard — any authenticated user who discovers the route via browser devtools can call them directly with their JWT. The React guard is invisible to `curl`.

**Why it happens:**
The current codebase already has admin roles stored in DB but "not enforced at route level" (per milestone context). This is the classic gap: DB has the data, frontend hides the UI, backend trusts the frontend.

**How to avoid:**
- Add a `RolesGuard` to every `/admin/*` NestJS route. The guard reads `request.user.role` (populated by `JwtAuthGuard`) and rejects if not `admin`.
- Register guards in order: `@UseGuards(JwtAuthGuard, RolesGuard)` — `JwtAuthGuard` must run first to populate `request.user`, otherwise `RolesGuard` reads undefined and either throws or silently passes.
- Use a `@Roles('admin')` decorator so role requirements are co-located with the route, not hidden in a separate file.

**Warning signs:**
- Admin endpoints return 200 for non-admin users in a Postman/curl test
- No guard decorators on admin controllers
- `request.user.role` is accessed in business logic layer instead of guard layer

**Phase to address:**
Admin RBAC phase — must be implemented before any admin UI, not after.

---

### Pitfall 5: Guard Execution Order — RolesGuard Before JwtAuthGuard

**What goes wrong:**
`RolesGuard` reads `request.user.role` but `JwtAuthGuard` hasn't run yet to populate `request.user`. Result: `Cannot read properties of undefined (reading 'role')` or, worse, the guard silently returns `false` for everyone including real admins, locking out the admin section.

**Why it happens:**
When `RolesGuard` is registered globally (e.g., in `AppModule` providers) and `JwtAuthGuard` is applied at the controller level, NestJS runs the global guard first. This is a confirmed NestJS issue (GitHub issue #5598).

**How to avoid:**
Apply both guards at the controller or method level in the correct order:
```typescript
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('admin')
@Controller('admin')
export class AdminController {}
```
Never register `RolesGuard` globally if `JwtAuthGuard` is not also global. Prefer applying both together consistently.

**Warning signs:**
- Admin endpoints throw 500 instead of 401/403
- Error: `Cannot read properties of undefined` in guard stack trace
- All admin requests blocked even for actual admin accounts

**Phase to address:**
Admin RBAC phase — test with both an admin JWT and a non-admin JWT before marking complete.

---

### Pitfall 6: Missing Critical Stripe Subscription Event Handlers

**What goes wrong:**
Only `checkout.session.completed` and `invoice.paid` are handled. The following are ignored, causing silent revenue loss and access bugs:

| Missing Event | Consequence |
|---|---|
| `invoice.payment_failed` | User keeps access after card decline; no dunning email sent |
| `customer.subscription.deleted` | User keeps access after cancellation or failed recovery |
| `customer.subscription.updated` | Plan downgrades/upgrades not reflected in DB |
| `customer.subscription.trial_will_end` | No warning emails for trial users |

**Why it happens:**
The happy path (subscribe → pay → use) is built first, edge cases deferred. In a solo founder sprint, "ship the checkout" feels complete when money flows in — but the off-ramps (failed payments, cancellations) are where churn and fraud live.

**How to avoid:**
Implement a `switch(event.type)` handler on day one with explicit cases for at minimum:
- `checkout.session.completed` → provision
- `invoice.paid` → confirm active, reset usage counters if monthly
- `invoice.payment_failed` → mark subscription as `past_due`, trigger dunning
- `customer.subscription.deleted` → revoke access immediately
- `customer.subscription.updated` → sync plan tier to DB

**Warning signs:**
- DB subscription status never changes to `past_due` or `canceled`
- Cancelled subscribers still make successful API calls
- No webhook handler for `invoice.payment_failed` in the codebase

**Phase to address:**
Stripe Checkout phase — stubbing only `checkout.session.completed` is insufficient for production.

---

## Moderate Pitfalls

### Pitfall 7: Stripe Test Mode Keys in Production (or Vice Versa)

**What goes wrong:**
`sk_test_*` in a production `.env` causes all charges to silently succeed in test mode — real money is never collected. Or `sk_live_*` leaks into a staging environment and real charges are made during QA.

**Why it happens:**
Single `.env.example` file with placeholder keys; deployer copies without switching keys; CI/CD pipeline shares environment variables across staging and production.

**How to avoid:**
- Separate env variable sets per environment: `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_PUBLISHABLE_KEY`.
- The publishable key prefix (`pk_test_` vs `pk_live_`) is visible in the frontend bundle — add a startup assertion in the backend: `if (process.env.NODE_ENV === 'production' && STRIPE_SECRET_KEY.startsWith('sk_test_')) throw new Error('TEST KEY IN PRODUCTION')`.
- Webhook signing secrets are **different** between test and live — a test secret will fail verification against live events.

**Warning signs:**
- Stripe Dashboard shows charges only in test mode even after go-live
- Webhook signature verification fails in production but works locally
- `pk_test_` visible in production browser network tab

**Phase to address:**
Stripe Checkout phase (pre-launch checklist).

---

### Pitfall 8: Hardcoded Stripe Price IDs in Code

**What goes wrong:**
`price_XXXXXXX` IDs are copy-pasted from the Stripe Dashboard into source code or constants. When prices are updated (e.g., annual discount added, currency changed), a code deploy is required. Test mode and live mode have different price IDs — a single constant can't serve both.

**Why it happens:**
Fastest path to working checkout during MVP. Works fine in test, breaks silently if test price IDs are committed and used in production (Stripe returns `No such price` error).

**How to avoid:**
- Store price IDs in environment variables: `STRIPE_PRICE_BASIC_MONTHLY`, `STRIPE_PRICE_PRO_MONTHLY`.
- Or use Stripe `lookup_key` when creating prices, then retrieve by lookup key at runtime — allows price updates without redeploying.

**Warning signs:**
- `price_` strings literal in source code
- Same price ID constant used for test and production environments
- `No such price: price_XXXXXXX` errors in Stripe logs after environment switch

**Phase to address:**
Stripe Checkout phase (initial setup).

---

### Pitfall 9: Not Attaching Stripe Customer ID to User Record

**What goes wrong:**
A Stripe Customer is created on first checkout but the `customer.id` (`cus_XXXXXXX`) is not saved to the users DB table. On second checkout or portal access, a duplicate customer is created. Subscription history is fragmented across multiple Stripe customers. Refunds and plan changes become manual operations.

**Why it happens:**
The checkout session creates a customer implicitly — developers see `subscription.customerId` on the session and think "Stripe handles it". They forget that Stripe has no awareness of their user table.

**How to avoid:**
- On `checkout.session.completed`, extract `session.customer` and save it to `users.stripe_customer_id`.
- Before creating a new Checkout Session, look up `users.stripe_customer_id` — if it exists, pass `customer: existingCustomerId` to `stripe.checkout.sessions.create()` to reuse the same customer.

**Warning signs:**
- Multiple `cus_` entries in Stripe with the same email
- Users can't access the billing portal (portal requires a customer ID)
- Payment method update flow creates a new subscription instead of updating the existing one

**Phase to address:**
Stripe Checkout phase.

---

### Pitfall 10: Admin Endpoints Leaking User PII in List Responses

**What goes wrong:**
`GET /admin/users` returns full user objects including hashed passwords, tokens, internal flags, or billing details not needed by the admin UI. Admin tokens are often longer-lived than regular user sessions — a compromised admin token exposes all user data.

**Why it happens:**
Quick implementation returns the full DB entity. NestJS doesn't automatically strip fields from Typeorm/Prisma responses.

**How to avoid:**
- Use dedicated Admin DTOs (e.g., `AdminUserDto`) that include only fields the UI needs.
- Apply `ClassSerializerInterceptor` with `@Exclude()` on sensitive fields, or use `plainToInstance` in service layer.
- Return paginated results with explicit `select` clauses, never `SELECT *`.

**Warning signs:**
- Network tab shows `password_hash`, `reset_token`, or full card details in admin API responses
- Admin user list includes fields the admin UI doesn't display
- No DTO transformation between DB entity and HTTP response

**Phase to address:**
Admin RBAC phase.

---

### Pitfall 11: EU VAT Not Collected — Romania-Specific Obligations

**What goes wrong:**
SaaS launched without VAT collection. For B2C EU customers: Romanian standard VAT is 19% (not 21% — the 21% figure in some sources is outdated; verify with current ANAF guidance). For cross-border B2C above €10,000 threshold, VAT must be collected in the customer's country via EU OSS. Missing this means back-taxes, penalties, and potential account suspension.

**Why it happens:**
Solo founders focus on product, assume "I'll add tax later". Romania has specific e-invoicing (eFactura) requirements for B2B domestic transactions as of 2024, adding compliance complexity beyond what most Stripe tutorials cover.

**How to avoid:**
- Enable **Stripe Tax** from day one — it handles EU VAT calculation and OSS reporting automatically.
- In `stripe.checkout.sessions.create()`, set `automatic_tax: { enabled: true }` and set `customer_update: { address: 'auto' }` to collect billing address.
- For B2B customers: collect VAT ID via `tax_id_collection: { enabled: true }` — Stripe validates EU VAT IDs and applies reverse charge automatically.
- Register for Romania OSS (One Stop Shop) before hitting the €10,000 cross-border B2C threshold.
- Consult a Romanian accountant regarding eFactura B2B e-invoicing obligations (mandatory for domestic B2B since 2024).

**Warning signs:**
- No `automatic_tax` in checkout session creation code
- No VAT line in Stripe invoices
- No billing address collected at checkout
- No OSS registration when cross-border B2C sales begin

**Phase to address:**
Stripe Checkout phase — Stripe Tax must be enabled before the first paid transaction.

---

### Pitfall 12: Stripe Customer Portal Not Wired Up — Self-Service Subscription Management Missing

**What goes wrong:**
Users have no way to update their payment method, download invoices, or cancel. They email support (which doesn't exist for a solo founder). Failed payment method updates mean lost subscribers. Users who want to cancel churn out by disputing the charge with their bank instead — triggering a chargeback.

**Why it happens:**
The portal is considered "phase 2" — checkout first, then portal. But users whose card expires in month 2 are stranded immediately.

**How to avoid:**
- Wire up `POST /billing/portal` endpoint that calls `stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: ... })` and redirects the user.
- Add a "Manage Subscription" link in the user dashboard settings page.
- The Stripe Customer Portal is nearly zero-code — there's no excuse to defer it.

**Warning signs:**
- No billing portal link in the settings/dashboard UI
- No `/billing/portal` or equivalent endpoint in the backend
- Support requests about updating payment methods before the portal exists

**Phase to address:**
Stripe Checkout phase — ship portal endpoint at the same time as checkout.

---

## Minor Pitfalls

### Pitfall 13: Webhook Endpoint Exposed Without Signature Verification During Development

**What goes wrong:**
Developer adds a `// TODO: verify signature` comment and ships to staging. Staging URL gets indexed or shared, and arbitrary events are posted to it.

**Prevention:**
Signature verification is not optional even in development. Use `stripe listen --forward-to localhost:3000/webhook` (Stripe CLI) locally — it provides a local webhook secret that works without HTTPS. Never disable verification with a flag.

---

### Pitfall 14: No Webhook Endpoint Registered in Stripe Dashboard for Production

**What goes wrong:**
Webhook works locally via Stripe CLI but is never registered in the Stripe Dashboard for production. Go-live: no events delivered, no subscriptions activated.

**Prevention:**
Add webhook registration to the go-live checklist. Register `https://api.pdfthumb.com/stripe/webhook` in Stripe Dashboard under Developers → Webhooks. Copy the signing secret to the production environment.

---

### Pitfall 15: Using `stripe.on('event')` Instead of Webhook Endpoint

**What goes wrong:**
Some tutorials use Stripe's event polling (`stripe.events.list()`) instead of webhooks. This works in scripts but is not reliable for production subscription management — events can be missed if the poller is down.

**Prevention:**
Webhooks only. The stub in the existing codebase is already a webhook endpoint — keep it that way.

---

### Pitfall 16: Admin Role Promotable by Any Authenticated User

**What goes wrong:**
`PATCH /users/:id` (profile update) accepts a `role` field in the request body and sets it on the user record. Any logged-in user can send `{ "role": "admin" }` and elevate themselves.

**Prevention:**
Never accept `role` as a user-supplied field in profile update endpoints. Role changes must only be possible via a separate admin-only endpoint (`PATCH /admin/users/:id/role`) guarded by `@Roles('admin')`.

---

### Pitfall 17: Exposing Stripe Secret Key to the Frontend

**What goes wrong:**
`STRIPE_SECRET_KEY` ends up in Vite's env handling (any variable without `VITE_` prefix should be backend-only, but mistakes happen). The key is embedded in the client bundle, allowing anyone to make arbitrary Stripe API calls including refunds and subscription cancellations.

**Prevention:**
Only `STRIPE_PUBLISHABLE_KEY` (prefixed `pk_`) belongs in the frontend. All API calls that use `STRIPE_SECRET_KEY` (`sk_`) stay on the NestJS backend. Audit the Vite build output for `sk_` strings before every production deploy.

---

## Technical Debt Patterns

| Shortcut | Immediate Benefit | Long-term Cost | When Acceptable |
|----------|-------------------|----------------|-----------------|
| Skip idempotency table, rely on DB unique constraints | Faster to ship | Silent failures on webhook retry; hard to debug | Never — add from day one |
| Single webhook secret for test + production | One less env var | Test webhooks processed in production | Never |
| Provision on redirect URL, not webhook | Instant UX after checkout | ~1-5% of users have access without payment | Never |
| Hardcode price IDs | Faster checkout session creation | Code deploy required for any pricing change | MVP only if in env vars |
| Skip Stripe Tax at launch | No billing complexity | Back-tax liability, potential legal issues | Never if selling to EU customers |
| Frontend-only admin guard | Admin UI ships faster | Any authenticated user can hit admin API | Never |
| No customer portal at launch | 1 less endpoint to build | Chargebacks from users who can't self-cancel | Never — 30-minute build |

---

## Integration Gotchas

| Integration | Common Mistake | Correct Approach |
|-------------|----------------|------------------|
| Stripe Webhooks + NestJS | Parsed JSON body passed to `constructEvent()` | `rawBody: true` in `NestFactory.create()`, use `req.rawBody` |
| Stripe Webhooks + Auth middleware | Global `JwtAuthGuard` blocks Stripe's unauthenticated POST | Add `@Public()` decorator to the webhook route, or exclude it from global guard |
| Stripe Checkout + existing user | New Stripe Customer created every checkout | Look up `users.stripe_customer_id` first; pass `customer:` param if exists |
| NestJS JwtAuthGuard + RolesGuard | RolesGuard runs before user is decoded | Use `@UseGuards(JwtAuthGuard, RolesGuard)` together, never register RolesGuard globally alone |
| Stripe Tax + Checkout | `automatic_tax` not enabled → VAT not collected | Set `automatic_tax: { enabled: true }` in every checkout session |
| Stripe Price IDs + environments | Test price ID used in production | Store price IDs in env vars, one set per environment |

---

## Performance Traps

| Trap | Symptoms | Prevention | When It Breaks |
|------|----------|------------|----------------|
| Synchronous webhook processing with DB writes | Stripe sees timeout, marks delivery failed, retries → duplicate processing storm | Return 200 after signature verify; process via BullMQ queue | Any slow DB or third-party call in webhook handler |
| Polling Stripe API for subscription status on every API request | High latency, Stripe rate limits hit | Cache subscription status in DB, refresh on webhook events | ~100+ API requests/minute |
| Admin user list with no pagination | Admin page hangs on large user base | Paginate with `limit`/`offset`, use indexed queries | ~1,000+ users |

---

## Security Mistakes

| Mistake | Risk | Prevention |
|---------|------|------------|
| No webhook signature verification | Attacker can fake subscription events (grant free access) | Always call `stripe.webhooks.constructEvent()` with raw body |
| Admin endpoints return 200 without role check | Horizontal privilege escalation — any user accesses all user data | `@UseGuards(JwtAuthGuard, RolesGuard)` + `@Roles('admin')` on all admin routes |
| `role` field accepted in profile PATCH | Self-privilege escalation to admin | Remove `role` from user-facing update DTOs |
| Stripe secret key in frontend env | Full Stripe account compromise | `sk_` keys in backend only; `pk_` in frontend only |
| Admin JWT same expiry as user JWT | Compromised admin token valid for same duration as user token | Consider shorter-lived admin tokens or require re-auth for sensitive admin operations |
| No rate limiting on webhook endpoint | DoS via webhook flooding | Apply NestJS ThrottlerGuard or dedicated rate limiter to `/stripe/webhook` |

---

## UX Pitfalls

| Pitfall | User Impact | Better Approach |
|---------|-------------|-----------------|
| Success page shows "loading" permanently (webhook delay) | User thinks payment failed, tries again → duplicate charge attempt | Poll `/subscription/status` with retry; show "confirming payment…" with a spinner capped at 30s |
| No billing portal link | User can't update card; subscription lapses | Add "Manage Billing" link in dashboard settings that calls the portal endpoint |
| Plan upgrade/downgrade requires support contact | Users churn rather than downgrade | Wire up Stripe Customer Portal — handles plan changes natively |
| Access revoked mid-session after card decline | User is mid-workflow when API calls start returning 402 | Show a payment-required banner; don't silently kill in-flight requests |
| Admin section visible in nav to non-admins | Confusion; users try to access and get 403 | Conditionally render admin nav items based on `user.role` from JWT claims |

---

## "Looks Done But Isn't" Checklist

- [ ] **Stripe Checkout:** Verify `checkout.session.completed` webhook is received and subscription is activated in DB — not just that the success URL loads
- [ ] **Webhook Security:** Confirm signature verification throws an error when `Stripe-Signature` header is missing or tampered with
- [ ] **Webhook Idempotency:** Send the same `invoice.paid` event twice — verify only one activation email is sent and DB state is unchanged on second delivery
- [ ] **Failed Payment:** Trigger a failed payment with Stripe test card `4000 0000 0000 0341` — verify subscription goes to `past_due` in DB and access is restricted
- [ ] **Cancellation:** Cancel a subscription from Stripe Dashboard — verify access is revoked within one webhook delivery cycle
- [ ] **Admin Guard:** Hit `GET /admin/users` with a non-admin JWT in Postman — verify 403 returned
- [ ] **Role Self-Promotion:** Send `PATCH /users/:id` with `{ "role": "admin" }` as a regular user — verify role is unchanged
- [ ] **Test/Live Key:** Check production deployment has `sk_live_` key, not `sk_test_`
- [ ] **VAT:** Create a test checkout with a EU billing address — verify VAT line appears in the Stripe invoice
- [ ] **Customer Portal:** Verify "Manage Billing" link opens a valid Stripe portal session (not a 404 or error page)
- [ ] **Duplicate Customer:** Complete checkout twice with the same user — verify only one Stripe Customer exists in the Dashboard

---

## Recovery Strategies

| Pitfall | Recovery Cost | Recovery Steps |
|---------|---------------|----------------|
| Raw body not preserved (webhooks all failed) | HIGH | Add `rawBody: true`, redeploy, replay failed events from Stripe Dashboard (up to 72h available) |
| Access provisioned without payment | HIGH | Audit Stripe for subscriptions with no successful `invoice.paid`; revoke access for unconfirmed sessions; issue refunds if needed |
| Duplicate customers created | MEDIUM | Merge customers in Stripe Dashboard (manual); backfill `stripe_customer_id` in users table from Stripe API |
| No VAT collected at launch | HIGH | Contact Romanian tax advisor; register for OSS retroactively; enable Stripe Tax immediately; assess liability |
| Admin endpoints unguarded | HIGH | Immediate: add guards; then audit access logs for unauthorized requests; rotate any exposed API keys |
| Test keys in production | HIGH | Rotate to live keys immediately; audit for real transactions that silently failed; no actual charges occurred |

---

## Pitfall-to-Phase Mapping

| Pitfall | Prevention Phase | Verification |
|---------|------------------|--------------|
| Raw body destroyed (Pitfall 1) | Stripe Checkout — webhook setup task | Stripe CLI test: `stripe trigger checkout.session.completed` returns 200 |
| Checkout redirect race condition (Pitfall 2) | Stripe Checkout — success page task | E2E test: success page polls and shows active subscription within 10s |
| Non-idempotent webhook (Pitfall 3) | Stripe Checkout — webhook handler task | Integration test: replay same event ID, verify no duplicate side effects |
| Frontend-only admin guard (Pitfall 4) | Admin RBAC — backend guard task | API test: non-admin JWT returns 403 on all `/admin/*` routes |
| Guard execution order (Pitfall 5) | Admin RBAC — guard implementation task | Unit test: RolesGuard with undefined `request.user` throws, not silently fails |
| Missing subscription event handlers (Pitfall 6) | Stripe Checkout — webhook handler task | Code review: switch statement has explicit cases for all 5 events |
| Test keys in production (Pitfall 7) | Stripe Checkout — go-live checklist | Startup assertion fails if `sk_test_` key in production env |
| Hardcoded price IDs (Pitfall 8) | Stripe Checkout — initial config task | Grep for `price_` literals in source code returns 0 results |
| No Stripe customer ID saved (Pitfall 9) | Stripe Checkout — webhook handler task | DB query: every user with active subscription has non-null `stripe_customer_id` |
| PII leakage in admin endpoints (Pitfall 10) | Admin RBAC — admin API task | Response payload inspection: no `password_hash` or tokens in admin user list |
| EU VAT not collected (Pitfall 11) | Stripe Checkout — initial config task | Test checkout with EU address: VAT line present in invoice |
| No customer portal (Pitfall 12) | Stripe Checkout — post-checkout task | Manual test: "Manage Billing" link opens portal without error |
| Role self-promotion via PATCH (Pitfall 16) | Admin RBAC — user update DTO task | API test: `PATCH /users/:id` with `role: admin` does not change role |

---

## Sources

- [Stripe Webhooks — Official Documentation](https://docs.stripe.com/webhooks) — HIGH confidence
- [Using webhooks with subscriptions — Stripe Docs](https://docs.stripe.com/billing/subscriptions/webhooks) — HIGH confidence
- [Stripe Webhook Signature Verification — stripe-node GitHub issue #341](https://github.com/stripe/stripe-node/issues/341) — HIGH confidence
- [NestJS raw body for Stripe webhooks — Manuel Heidrich's Blog](https://manuel-heidrich.dev/blog/how-to-access-the-raw-body-of-a-stripe-webhook-request-in-nestjs/) — MEDIUM confidence
- [NestJS Authorization — Official Documentation](https://docs.nestjs.com/security/authorization) — HIGH confidence
- [NestJS Guards — Official Documentation](https://docs.nestjs.com/guards) — HIGH confidence
- [Guard ordering issue — nestjs/nest GitHub issue #5598](https://github.com/nestjs/nest/issues/5598) — HIGH confidence (confirmed bug/behavior)
- [Stripe webhook race condition solution guide](https://excessivecoding.com/blog/billing-webhook-race-condition-solution-guide) — MEDIUM confidence
- [Best practices for integrating Stripe webhooks — Stigg](https://www.stigg.io/blog-posts/best-practices-i-wish-we-knew-when-integrating-stripe-webhooks) — MEDIUM confidence
- [Tax in the European Union — Stripe Docs](https://docs.stripe.com/tax/supported-countries/european-union) — HIGH confidence
- [Invoicing best practices for the EU — Stripe](https://stripe.com/guides/invoicing-best-practices-for-the-european-union) — HIGH confidence
- [Romania VAT guide for digital services — Anrok](https://www.anrok.com/vat-software-digital-services/romania) — MEDIUM confidence
- [Selling digital products in Romania — Romanian Lawyers](https://theromanianlawyers.com/selling-digital-products-and-subscriptions-in-romania-legal-steps-compliance-tips/) — MEDIUM confidence
- [Stripe customer portal — Official Documentation](https://docs.stripe.com/customer-management) — HIGH confidence
- [React RBAC best practice — Auth0 Community](https://community.auth0.com/t/best-practice-for-role-based-or-permission-based-authorization-in-a-react-spa/194364) — MEDIUM confidence

---
*Pitfalls research for: PDFThumb.io — Stripe subscriptions + admin RBAC milestone*
*Researched: 2026-02-18*
