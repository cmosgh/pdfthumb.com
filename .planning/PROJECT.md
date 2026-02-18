# PDFThumb.io

## What This Is

PDFThumb.io is a SaaS API service that generates thumbnail images from PDF files. This repository is the landing page and user portal — it lets developers discover the service, subscribe to a plan, and manage their API keys. The backend that processes PDFs lives in `pdfthumbnailpro-be` (NestJS API).

## Core Value

Users can get a working API key and start generating PDF thumbnails in under 5 minutes — the portal must make that path frictionless.

## Requirements

### Validated

<!-- Shipped and confirmed valuable. -->

- ✓ Landing page with Hero, Features, Pricing, and CTA sections — existing
- ✓ Google OAuth login flow with JWT access/refresh tokens — existing
- ✓ Dashboard layout with sidebar navigation (Overview, Analytics, Settings) — existing
- ✓ API key management: create, list, revoke — existing (live API integration)
- ✓ Profile settings form — existing
- ✓ Overview page with metrics (PDFs processed, thumbnails, API calls, growth) — existing (mock data)
- ✓ Analytics page with charts (usage trends, file types, geographic, error logs) — existing (mock data)
- ✓ Dark mode support — existing

### Active

<!-- Current scope. Building toward these. -->

- [ ] Stripe payment/subscription checkout flow (plan selection → checkout → access granted)
- [ ] Admin section: user list with subscription status (role-based, same dashboard)
- [ ] Admin section: per-user API key oversight and revocation
- [ ] Admin section: usage monitoring across all users
- [ ] Real analytics data: wire overview/analytics pages to live backend data
- [ ] Token auto-refresh: automatic refresh before expiration (currently only on-demand)
- [ ] Branding consistency: standardize on "PDFThumb.io" across header, footer, all pages
- [ ] User-facing error feedback: surface API errors to users (not just console.log)

### Out of Scope

<!-- Explicit boundaries. Includes reasoning to prevent re-adding. -->

- GitHub OAuth — BE strategy exists but no routes; defer until meaningful demand
- Email notifications — UI toggle placeholder exists; no backend support; v2
- Activity log page — useful but not critical for launch
- Mobile app — web-first, mobile later
- Unit/component tests — Playwright E2E coverage is sufficient for launch pace

## Context

**Backend:** NestJS API (`pdfthumbnailpro-be`) with SQLite/Postgres + Redis. Key endpoints:
- Auth: `GET /api/auth/google`, `POST /api/auth/refresh`, `POST /api/auth/logout`
- API keys: `POST /api/api-key/generate`, `GET /api/api-key`, `DELETE /api/api-key/:id`
- Subscriptions: `GET/POST /api/subscriptions/types` (admin), `GET/POST /api/users/:userId/subscription`
- Thumbnails: `POST /api/thumbnail/zip`, `POST /api/thumbnail/count`
- Payments: `POST /api/webhooks/stripe` (stub); `createCheckoutSession()` exists in PaymentService but no HTTP endpoint yet
- No dedicated analytics endpoints — only `currentMonthlyUsage` from user subscription endpoint

**Admin access:** `UserRole.ADMIN` exists in the BE user entity but RBAC is not enforced at route level. Admin routes currently use API key auth as a proxy. Role-based FE views + BE role enforcement needed.

**Analytics gap:** The overview/analytics pages use mock data. Backend has no `/api/analytics` or `/api/dashboard` endpoints — these will need to be added to the BE alongside FE wiring.

**Payment location:** Romania. Stripe is available in Romania (EU), but may need to configure EU tax settings (OSS). Worth researching Stripe Checkout vs Paddle as EU-friendly alternatives.

## Constraints

- **Tech stack**: React 19, TanStack Router 1.x, TanStack Query 5, TanStack DB 0.4 (experimental), Tailwind CSS v4, Vite 7 — keep the existing stack
- **Auth**: localStorage JWT (security concern noted in codebase map — httpOnly cookies are the ideal, but not blocking launch)
- **Backend dependency**: Analytics endpoints need to be added to `pdfthumbnailpro-be` before FE can wire them up
- **Payment**: Stripe SDK already in BE; webhook endpoint exists but handler stubs are TODO

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Role-based admin in same dashboard | Admin is one person for now; separate app would be over-engineering | — Pending |
| Stripe for payments | BE already has Stripe SDK + webhook endpoint; switching adds risk | — Pending (Romania tax research needed) |
| TanStack DB for client cache | Already in use; switching for v1 launch is not worth it | — Pending |
| Mock data approach for overview | Unblock FE development while BE analytics endpoints don't exist yet | ✓ Good short-term, needs real data before launch |

---
*Last updated: 2026-02-18 after initialization*
