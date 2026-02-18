# Stack Research

**Domain:** Payment processing for SaaS subscription API service (Romania/EU)
**Researched:** 2026-02-18
**Confidence:** HIGH (Stripe Romania availability, pricing, VAT); MEDIUM (e-invoicing tooling specifics)

---

## Recommendation: Stay on Stripe

The backend already has Stripe partially integrated (SDK installed at API version 2025-08-27.basil, webhook endpoint, `createCheckoutSession()` stub, subscription type CRUD). Stripe is fully available in Romania, handles EU VAT automatically via Stripe Tax, and has a specific third-party Stripe App Marketplace integration for Romania's mandatory RO e-Factura compliance. There is no reason to switch processors.

Paddle and Lemon Squeezy would require a full rewrite of the existing integration for marginal VAT-automation benefit at a higher transaction cost (5% + $0.50 vs ~1.5% + €0.25).

---

## Recommended Stack

### Core Technologies

| Technology | Version | Purpose | Why Recommended |
|------------|---------|---------|-----------------|
| Stripe Billing | SDK `stripe@^17` (API `2025-08-27.basil`) | Subscription lifecycle management | Already installed; Forrester Leader Q1 2025; native recurring billing, trial support, proration, upgrade/downgrade |
| Stripe Tax | Built into Stripe | Automatic EU VAT calculation & collection | Calculates VAT per customer location, validates VAT IDs, applies reverse charge for B2B, generates OSS-ready reports. 0.5% per tax-inclusive transaction |
| Stripe Checkout (hosted) | Same SDK | Payment UI | PCI-compliant hosted page; handles SCA/3DS automatically (PSD2 required); fastest path to production |
| Stripe Customer Portal | Same SDK | Self-service billing management | Prebuilt hosted portal; customers update cards, download invoices, cancel subscriptions without custom UI |
| RO e-Factura Stripe App | v1 (Marketplace app) | Romania mandatory e-invoicing | Third-party Stripe App that auto-submits invoices to ANAF RO e-Factura system from within Stripe Dashboard |
| @stripe/react-stripe-js | `^3.x` | React frontend checkout integration | Official React wrapper; enables EmbeddedCheckout component or redirect-to-hosted flow |
| @stripe/stripe-js | `^5.x` | Stripe.js loader | Required peer dependency for React integration |

### Supporting Libraries

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| stripe (npm) | `^17.x` (already installed) | Backend Stripe SDK for NestJS | All server-side Stripe operations — already present, verify API version compatibility |
| @golevelup/nestjs-stripe | `^0.6.x` | NestJS Stripe module with decorator-based webhook handlers | Optional but reduces boilerplate for `@StripeWebhookHandler('invoice.paid')` patterns |

### Development Tools

| Tool | Purpose | Notes |
|------|---------|-------|
| Stripe CLI | Local webhook forwarding and event simulation | `stripe listen --forward-to localhost:3000/api/webhooks/stripe` — essential for local dev |
| Stripe Dashboard | Product/price configuration, webhook monitoring, test mode | Create Products and Prices here before coding; test mode is separate from live |

---

## EU/Romania-Specific Requirements

### VAT Obligations (HIGH confidence)

Romania's VAT rate for digital services (SaaS/electronically supplied services) is **19%**. As a Romanian business selling to EU customers:

- **Under €10,000/year in cross-border EU B2C sales**: Charge Romanian VAT (19%) to all EU customers
- **Over €10,000/year threshold**: Must charge each customer their local EU VAT rate and file via OSS (One Stop Shop at anaf.ro)
- **B2B EU sales**: Zero-rate with reverse charge (customer self-reports their local VAT)
- **Stripe Tax handles all of this automatically** once enabled — calculates, collects, and generates OSS-ready reports

Enable Stripe Tax on your account and attach `automatic_tax: { enabled: true }` to Checkout Sessions and subscriptions.

### Romania RO e-Factura (MEDIUM confidence — verify current scope)

Since **January 1, 2025**, all invoices issued by Romanian businesses must be submitted to the national ANAF RO e-Factura system, including:
- Domestic B2B invoices (mandatory since July 2024)
- Domestic B2C invoices (mandatory since January 2025)
- **B2C international invoices**: Transmit required (per stripe-efactura.ro)
- **B2B international invoices (cross-border EU/export)**: Currently out of scope

**Stripe does not natively submit to RO e-Factura.** Use the **RO E-Factura app** from the Stripe App Marketplace (`marketplace.stripe.com/apps/ro-e-factura`):
- Free for first 50 invoices
- 99 RON/month (~€20/month) for unlimited invoices, automatic sending, XML download
- Automatic sending mode: polls paid Stripe invoices and submits to ANAF without manual action
- Source: stripe-efactura.ro

**This tool handles compliance without touching application code.** It is a Dashboard-level integration, not an API-level one.

### Stripe Pricing for Romania (MEDIUM confidence — verify via stripe.com/en-ro/pricing)

Romania is in the EEA. Published rates follow EU/EEA structure:
- Standard EU cards: ~1.5% + €0.25 per transaction
- Premium/non-EEA cards: 1.9%–2.5% surcharge
- Stripe Tax: +0.5% per transaction (waived on first €100k of taxable volume for new accounts)
- Stripe Billing: Included in standard fees for pay-as-you-go; separate pricing for high-volume enterprise

Source: stripe.com pricing page (European Economic Area section), multiple calculators

---

## What Backend Work Is Needed (from current state)

The backend has scaffolding but nothing production-ready. Required work:

1. **Expose `createCheckoutSession` as HTTP endpoint** — `POST /api/payments/checkout` — currently only exists as a private service method
2. **Complete webhook handler** — `POST /api/webhooks/stripe` exists but only stubs `customer.subscription.updated` and `customer.subscription.deleted`. Add full handling:
   - `checkout.session.completed` — provision API key access
   - `invoice.paid` — confirm active access, store renewal date
   - `invoice.payment_failed` — flag account, email user
   - `customer.subscription.deleted` — revoke API key access
3. **Raw body middleware** — Stripe webhook signature verification requires the raw HTTP body. NestJS's default JSON parser destroys it. Must configure `rawBody: true` in `NestFactory.create()` or use `express.raw()` middleware on the webhook route only
4. **Create Stripe Products and Prices** — Do this in Stripe Dashboard (not code); store Price IDs in environment variables
5. **Customer portal endpoint** — `POST /api/payments/portal` to create billing portal sessions
6. **Store Stripe customer ID** — persist `stripe_customer_id` on user record; required to link Stripe events to internal users
7. **Enable Stripe Tax** — in Dashboard: activate Stripe Tax, add Romanian business address, configure product tax codes (SaaS = `txcd_10000000` or software subscription)
8. **Subscription status field on user/subscription** — map `active | trialing | past_due | canceled | unpaid` from Stripe to internal access control

## What Frontend Work Is Needed

The frontend has a stub `handleInitiateCheckout()` in `src/paymentUtils.ts` that shows an `alert()`. Required work:

1. **Install `@stripe/react-stripe-js` and `@stripe/stripe-js`** — `npm install @stripe/react-stripe-js @stripe/stripe-js`
2. **Replace stub** — call `POST /api/payments/checkout` to get a Stripe-hosted Checkout URL, then redirect with `window.location.href = checkoutUrl`
3. **Success/cancel pages** — Create `/payment/success` and `/payment/cancel` routes that handle post-checkout redirect
4. **Customer portal link** — Add "Manage Billing" button in user portal that calls `POST /api/payments/portal` and redirects to Stripe's hosted portal

**Do not build custom payment forms.** The redirect-to-hosted Checkout approach handles SCA/3DS, PCI compliance, and EU payment methods (iDEAL, SEPA, etc.) automatically. Custom Elements integration is unnecessary complexity for this use case.

---

## Alternatives Considered

| Recommended | Alternative | When to Use Alternative |
|-------------|-------------|-------------------------|
| Stripe | Paddle | When you want full Merchant of Record (MoR) and zero VAT management overhead; Paddle files and remits taxes entirely on your behalf. Trade-off: 5% + $0.50/transaction (vs ~1.5% + €0.25), less developer control, starting over on current integration |
| Stripe | Lemon Squeezy | Acquired by Stripe in July 2024; roadmap uncertainty. Avoid new integrations with it |
| Stripe | Braintree/PayPal | Legacy; poor developer experience; no native EU subscription management |
| Stripe Checkout (hosted) | Stripe Elements (custom UI) | Only if brand consistency demands fully custom payment form AND you have time to manage PCI/SCA edge cases |
| RO e-Factura Stripe App | Building custom ANAF integration | Never; the API is complex XML/SOAP, not worth implementing in-house |

---

## What NOT to Use

| Avoid | Why | Use Instead |
|-------|-----|-------------|
| Lemon Squeezy | Acquired by Stripe July 2024; product direction unclear; community migrating away | Stripe directly |
| `stripe.redirectToCheckout()` | **Removed from Stripe.js** as of 2025-09-30 changelog | `window.location.href = session.url` for redirect-to-hosted, or `EmbeddedCheckout` component |
| Custom ANAF e-Factura API integration | ANAF API is complex, Romanian-language documentation, XML/SOAP stack, high maintenance | RO E-Factura Stripe App (marketplace.stripe.com/apps/ro-e-factura) |
| Global `AuthGuard` on webhook endpoint | Breaks Stripe webhook signature verification (Stripe sends without auth tokens) | Exclude `/api/webhooks/stripe` from auth middleware |
| `express.json()` body parser on webhook route | Destroys raw body needed for Stripe signature verification | Use `express.raw({ type: 'application/json' })` on webhook route only, or `rawBody: true` in NestJS bootstrap |

---

## Stack Patterns by Variant

**If selling only to Romanian domestic customers (B2B only):**
- OSS not needed; standard Romanian VAT registration sufficient
- RO e-Factura mandatory for all invoices

**If selling internationally (B2C globally — the likely case for an API SaaS):**
- Enable Stripe Tax (handles VAT automatically)
- Register for EU OSS once cross-border B2C exceeds €10,000/year
- Enable Stripe Tax's OSS reporting feature for ANAF filing

**If subscription plans include a free tier:**
- Free plans do not require Stripe Checkout session; just provision API key directly after email verification
- Only create Stripe Customer + Checkout Session for paid plan upgrades

---

## Version Compatibility

| Package | Compatible With | Notes |
|---------|-----------------|-------|
| `stripe@^17.x` | Node.js 18+, NestJS 10+ | Already installed; API version `2025-08-27.basil` is current |
| `@stripe/react-stripe-js@^3.x` | React 19 (used in this project) | Confirmed compatible |
| `@stripe/stripe-js@^5.x` | Modern browsers | Loaded async; does not block page render |

---

## Installation

```bash
# Frontend (React SPA)
npm install @stripe/react-stripe-js @stripe/stripe-js

# Backend — Stripe SDK already installed
# Verify version: npm list stripe
# If upgrading: npm install stripe@^17

# Optional: NestJS Stripe module (reduces webhook boilerplate)
npm install @golevelup/nestjs-stripe
```

---

## Sources

- [Stripe global availability](https://stripe.com/global) — Romania confirmed supported (MEDIUM: page rendered JS-only, could not extract text directly; confirmed via multiple secondary sources)
- [Stripe Tax EU documentation](https://docs.stripe.com/tax/supported-countries/european-union) — EU VAT calculation, OSS, B2B reverse charge (HIGH)
- [Stripe Tax Romania](https://docs.stripe.com/tax/supported-countries/european-union/romania) — All PTCs supported, registration threshold 1 transaction (HIGH)
- [Stripe Billing subscriptions — build integration](https://docs.stripe.com/billing/subscriptions/build-subscriptions?platform=web&ui=elements) — Checkout Session flow, webhook events (HIGH)
- [Stripe webhook subscription events](https://docs.stripe.com/billing/subscriptions/webhooks) — Access provisioning strategy, critical events (HIGH)
- [React Stripe.js reference](https://docs.stripe.com/sdks/stripejs-react) — Component API, EmbeddedCheckout vs redirect (HIGH)
- [redirectToCheckout removal changelog](https://docs.stripe.com/changelog/clover/2025-09-30/remove-redirect-to-checkout) — `redirectToCheckout` method deprecated Sept 2025 (HIGH)
- [RO E-Factura Stripe App Marketplace](https://marketplace.stripe.com/apps/ro-e-factura) — Stripe marketplace app for ANAF submission (MEDIUM — page JS-only; confirmed via stripe-efactura.ro)
- [stripe-efactura.ro pricing](https://stripe-efactura.ro/pricing) — Free 50 invoices, 99 RON/month unlimited (MEDIUM — third-party tool, verify pricing before committing)
- [stripe-efactura.ro how it works](https://stripe-efactura.ro/how-does-it-work) — Automatic sending, B2C international scope (MEDIUM)
- [Romania e-invoicing reform 2025](https://www.globalvatcompliance.com/globalvatnews/romania-e-invoicing-reform-2025/) — B2C scope from January 2025, cross-border exclusions (MEDIUM)
- [Legal requirements Romania digital services](https://theromanianlawyers.com/selling-digital-products-and-subscriptions-in-romania-legal-steps-compliance-tips/) — VAT thresholds, ANAF registration, 10-year record keeping (MEDIUM)
- [Paddle vs Stripe MoR comparison](https://unibee.dev/blog/paddle-vs-stripe-the-ultimate-2025-comparison/) — MoR trade-offs for solo developers (LOW — single source, used for alternatives comparison only)
- [NestJS Stripe webhooks — raw body](https://indusvalley.io/blogs/stripe-webhooks-nestjs-guide) — `rawBody: true` configuration requirement (MEDIUM)

---

*Stack research for: PDFThumb.io — Payment processing (Romania/EU SaaS)*
*Researched: 2026-02-18*
