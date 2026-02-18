# Feature Research

**Domain:** Admin section — developer-facing API SaaS (PDF thumbnail generation)
**Researched:** 2026-02-18
**Confidence:** MEDIUM — Core categories verified against multiple SaaS admin references; specific priority weighting based on single-admin/launch context is inference from patterns

---

## Context: What Makes This Admin Different

This admin is **not** a customer-facing feature. It is an internal operations panel for one person (the product owner) at launch. The goal is operational visibility and control, not impressive UX. Every feature that isn't directly about "can the admin keep the product running and respond to problems?" is waste for v1.

The existing backend already has:
- User subscription management endpoints (`GET/POST /api/users/:userId/subscription`)
- API key CRUD (`POST /api/api-key/generate`, `GET /api/api-key`, `DELETE /api/api-key/:id`)
- `UserRole.ADMIN` on the user entity (unenforced at route level)
- No dedicated analytics/dashboard endpoints — only `currentMonthlyUsage` from subscription endpoint

---

## Feature Landscape

### Table Stakes (Admin Can't Function Without These)

Features that, if missing, make it impossible to manage the product in production.

| Feature | Why Expected | Complexity | Notes |
|---------|--------------|------------|-------|
| User list with subscription status | Admin must know who has what plan to handle support requests | LOW | Paginated table: email, plan, join date, last active. Backend endpoint exists. |
| Per-user usage overview | Required to detect overages, validate billing, and handle "why am I being charged?" | LOW-MEDIUM | `currentMonthlyUsage` field already in subscription endpoint. Aggregate view needed. |
| Manual plan assignment / override | Comp accounts, migration fixes, comped trials, compensation for outages | MEDIUM | POST `/api/users/:userId/subscription` exists. FE form to select plan + confirm. |
| View all API keys per user | Support requests require admin to see what keys exist; security events require key auditing | LOW | Backend `GET /api/api-key` scoped to user — admin needs a cross-user view or per-user drill-down. |
| Revoke any user's API key | Abuse response, account termination, security incident | LOW | DELETE `/api/api-key/:id` exists — admin needs UI to trigger it for any user's key. |
| User suspend / disable account | Block abusive users, handle payment disputes, comply with takedown requests | MEDIUM | No backend endpoint yet. Requires BE work. Critical for abuse response. |
| RBAC enforcement: admin-only routes | Without this, the admin section is security theater | MEDIUM | `UserRole.ADMIN` exists in entity but not enforced at route level. Requires both FE guard and BE middleware. |

### Differentiators (Valuable at Launch, Not Blocking)

Features that make admin work faster or more informed without being gating.

| Feature | Value Proposition | Complexity | Notes |
|---------|-------------------|------------|-------|
| Platform-wide usage summary (all users, all time) | Single number answers "how much traffic is the product handling?" Useful for capacity, billing projections | MEDIUM | Requires new BE endpoint aggregating across users. FE is simple metric cards. |
| Users with highest usage (top-N table) | Immediately surfaces who your power users or potential abusers are | LOW (given usage data) | Sort user list by usage. No extra endpoint if usage is included in user list. |
| Error rate overview per user or global | PDF processing errors hit the admin's reputation; knowing error rate quickly allows response | MEDIUM | Requires BE analytics endpoint or log aggregation. |
| Subscription plan distribution chart | Quick visual: what % of users on free vs paid? Useful for pricing decisions | LOW (given user list) | Simple aggregate on user list data. One pie/bar chart. |
| Recent sign-ups (last 7/30 days) | Track growth without opening a database client | LOW | Filter/sort on user list. No extra data needed. |

### Anti-Features (Commonly Built, Usually Waste for v1)

Features that seem like good admin functionality but consume time with low operational return at single-admin/launch scale.

| Feature | Why Requested | Why Problematic | Alternative |
|---------|---------------|-----------------|-------------|
| Full audit log of all admin actions | "For compliance" / "to know what changed" | At single-admin launch scale: there is one person. Audit logs are expensive to build right (immutable, time-synced, searchable) and have zero practical value until there are multiple admins or enterprise customers asking for SOC 2. | Add a `updatedAt` timestamp and `updatedBy` field on subscription changes. That's enough for v1. |
| User impersonation / "login as user" | Useful for debugging user-specific issues | High complexity and security surface. For a PDF API, user-specific bugs are almost always API key issues or plan limits — both visible in admin without impersonation. | Show user's API keys + usage + error logs in admin view. That covers 90% of support cases. |
| Email/notification system from admin | "Contact users about outages / announcements" | Requires transactional email provider setup, unsubscribe handling, GDPR compliance. Disproportionate effort for launch when you can email manually. | Manual email for v1. Add email system only when you have > 100 users. |
| Bulk user operations (bulk plan change, bulk delete) | "Efficiency at scale" | You don't have the scale problem yet. Bulk operations are complex to implement safely (confirmation flows, partial failure handling). | Single-user operations for v1. Revisit at 500+ users. |
| Advanced analytics: funnel, cohort retention, LTV | Product analytics are valuable | Building custom analytics is a deep investment. These belong in a BI tool (Metabase, PostHog, Plausible) that queries the DB directly, not in a hand-rolled admin panel. | Use Metabase or similar for deep analytics. Admin panel shows operational data only. |
| Role management UI (create/edit admin roles) | "Flexibility for future admins" | There is one admin. A role management UI that manages roles for one person is gold-plating. | Hardcode `UserRole.ADMIN` check. Add role UI only when hiring a second person who needs limited admin access. |
| Webhook/event log viewer | Useful for debugging Stripe webhooks | Stripe Dashboard already shows webhook delivery history and lets you replay events. Building a duplicate is waste. | Use Stripe Dashboard for webhook debugging. |

---

## Feature Dependencies

```
RBAC enforcement (FE + BE)
    └──required by──> All admin routes (security foundation)

User list with subscription status
    └──enables──> Per-user usage overview
    └──enables──> Manual plan assignment
    └──enables──> View per-user API keys
    └──enables──> Revoke per-user API key

Per-user usage overview
    └──enhances──> Platform-wide usage summary (aggregate)
    └──enables──> Users with highest usage table

View per-user API keys
    └──required by──> Revoke any user's API key

User suspend / disable account
    └──requires──> New BE endpoint (no current implementation)
    └──requires──> RBAC enforcement (must be admin-only)

Platform-wide usage summary
    └──requires──> New BE analytics endpoint
```

### Dependency Notes

- **RBAC enforcement is the prerequisite**: Without BE role enforcement, every admin feature is accessible to any authenticated user. This must ship first or simultaneously with the first admin route.
- **User list gates everything**: All per-user admin operations require the ability to find and select a user. The user list is the navigation backbone of the admin section.
- **User suspend requires new BE work**: The backend has no suspend/disable endpoint. This is the only table-stakes feature that can't reuse existing endpoints.
- **Usage data for admin reuses subscription endpoint**: The `currentMonthlyUsage` field from `/api/users/:userId/subscription` is sufficient for per-user usage without a new endpoint. Aggregate/platform-wide usage needs a new endpoint.

---

## MVP Definition

### Launch With (v1 — must have for production)

- [ ] **RBAC enforcement on admin routes** — Without this, admin section is exposed to all authenticated users. Both FE route guard (check `UserRole.ADMIN`) and BE middleware must be in place.
- [ ] **User list with subscription status** — Searchable/sortable table: email, plan name, monthly usage (from existing subscription endpoint), join date. This is the admin's primary working surface.
- [ ] **Manual plan assignment** — Form to change a user's subscription plan. Required for comp accounts, migrations, and support escalations. Reuses existing BE endpoint.
- [ ] **Per-user API key list with revoke** — Drill into any user's keys. One-click revoke for abuse/security events. Reuses existing BE endpoints with admin scope.
- [ ] **User suspend / disable** — Block a user's API access without deleting their account. Requires new BE endpoint, but this is the only "nuclear option" for abuse at launch.

### Add After Validation (v1.x — add when first operational need arises)

- [ ] **Platform-wide usage summary cards** — Total API calls, total users, active users this month. Add when you need at-a-glance health without clicking into individual users. Requires new BE aggregate endpoint.
- [ ] **Top-N users by usage** — Sort user list by `currentMonthlyUsage` descending. Add when you want to proactively identify power users for upgrade conversations or abuse investigations.
- [ ] **Recent sign-ups view** — Filter user list to last 7/30 days. Add when growth rate becomes something you're actively tracking.

### Future Consideration (v2+ — defer until there's demonstrated need)

- [ ] **Email notifications from admin** — Add only when user base > 100 and you need to contact segments. Use Resend/Postmark at that point.
- [ ] **User impersonation** — Add only if support tickets regularly require reproducing user-specific state that isn't visible in admin data view. For a PDF API, this threshold is high.
- [ ] **Audit log** — Add when a second admin is hired OR when enterprise customers ask for it (SOC 2 requirement).
- [ ] **Bulk operations** — Add at 500+ users when individual-user admin becomes a bottleneck.
- [ ] **Deep analytics (cohort, funnel, LTV)** — Use Metabase pointed at production DB instead. Never build this in the admin panel.

---

## Feature Prioritization Matrix

| Feature | Admin Value | Implementation Cost | Priority |
|---------|-------------|---------------------|----------|
| RBAC enforcement (FE + BE) | HIGH | MEDIUM | P1 |
| User list with subscription status | HIGH | LOW | P1 |
| Manual plan assignment | HIGH | LOW | P1 |
| Per-user API key list + revoke | HIGH | LOW | P1 |
| User suspend / disable | HIGH | MEDIUM (needs new BE endpoint) | P1 |
| Platform-wide usage summary | MEDIUM | MEDIUM | P2 |
| Top-N users by usage | MEDIUM | LOW | P2 |
| Recent sign-ups view | LOW | LOW | P2 |
| User impersonation | LOW | HIGH | P3 |
| Audit log | LOW (at launch) | HIGH | P3 |
| Email from admin | MEDIUM | HIGH | P3 |
| Bulk operations | LOW (at launch) | MEDIUM | P3 |

**Priority key:**
- P1: Must have for launch — admin cannot manage the product without these
- P2: Should have — operational quality of life, add when P1 is stable
- P3: Nice to have — defer until clear need or user request

---

## Competitor Feature Analysis

Note: Competitor admin panels for PDF API services (Cloudmersive, iLovePDF/iLoveAPI, PDF.co) are not publicly documented. Reference points are comparable developer API SaaS patterns from Stripe, Twilio, and SaasRock.

| Feature | Stripe Dashboard (reference) | SaasRock Admin | PDFThumb Admin (v1 plan) |
|---------|------------------------------|----------------|--------------------------|
| User list | Full customer list with filter/search | Accounts + Users section | Searchable user table with plan + usage |
| Subscription management | Full Stripe subscription CRUD | Subscription management module | Manual plan assignment form |
| API key oversight | Restricted keys, per-team keys | API Management section | Per-user key list with revoke |
| Usage monitoring | Detailed per-customer usage | Metrics section | Per-user `currentMonthlyUsage` + aggregate |
| User suspension | Account flag/block | Role disable | Suspend endpoint (new BE work) |
| Impersonation | Not available (security policy) | Not documented | Deferred to v2 |
| Audit log | Full event log | Events section | Deferred to v2 (add `updatedBy` on changes) |

---

## Implementation Notes

### What "Admin Section in Same Dashboard" Means

The decision to put admin in the same dashboard (not a separate app) is correct for single-founder scale. Implementation pattern:

1. Dashboard sidebar gets an "Admin" section, conditionally rendered for `UserRole.ADMIN` only
2. New routes: `/dashboard/admin`, `/dashboard/admin/users`, `/dashboard/admin/users/:userId`
3. Auth guard: FE checks `user.role === 'ADMIN'` before rendering; BE validates same on every admin API call
4. No new layout needed — reuse `DashboardLayout.tsx` with conditional sidebar items

### Backend Work Required

The FE admin section can only be as capable as what the BE exposes. Current gaps:

| Admin Feature | BE Status | Work Needed |
|---------------|-----------|-------------|
| User list with subscription | Partial — `/api/users/:userId/subscription` exists but no list endpoint | New `GET /api/admin/users` endpoint |
| Manual plan assignment | Exists — `POST /api/users/:userId/subscription` | Just needs admin scope guard |
| Per-user API key list | Partial — `GET /api/api-key` is user-scoped | New `GET /api/admin/users/:userId/api-keys` or admin param on existing |
| Revoke any user's key | Exists — `DELETE /api/api-key/:id` | Needs admin bypass (currently user-scoped) |
| User suspend | Missing | New `POST /api/admin/users/:userId/suspend` endpoint |
| Platform-wide usage | Missing | New `GET /api/admin/analytics/summary` aggregate endpoint |

---

## Sources

- SaasRock Admin Portal documentation (saasrock.com/docs/articles/admin-portal) — MEDIUM confidence: live reference for common admin module patterns
- Indie Hackers discussion on admin dashboards (indiehackers.com/post/do-you-build-your-own-admin-dashboards) — LOW confidence: community opinion, not authoritative
- WorkOS user management features guide (workos.com/blog/user-management-features) — MEDIUM confidence: authoritative B2B SaaS auth vendor perspective
- EnterpriseReady audit log guide (enterpriseready.io/features/audit-log/) — MEDIUM confidence: industry reference for when audit logs matter
- Stytch user impersonation (stytch.com/blog/stytch-user-impersonation/) — MEDIUM confidence: implementation reference with security considerations
- Zluri SaaS user management guide (zluri.com/blog/saas-user-management) — LOW confidence: general market overview
- Project codebase analysis (src/types.ts, src/api.ts, .planning/PROJECT.md) — HIGH confidence: ground truth on existing implementation

---
*Feature research for: PDFThumb.io admin section*
*Researched: 2026-02-18*
