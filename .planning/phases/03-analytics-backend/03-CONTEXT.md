# Phase 3: Analytics Backend - Context

**Gathered:** 2026-02-19
**Status:** Ready for planning

<domain>
## Phase Boundary

Record thumbnail generation events in real-time (fire-and-forget, never blocking the thumbnail response), then expose aggregated usage stats via two endpoints: one for the authenticated user's own data, one for admins showing platform-wide data. No frontend wiring — that's Phase 4.

</domain>

<decisions>
## Implementation Decisions

### Event Data Shape

- Standard schema: user_id, api_key_id, timestamp, success (boolean), status_code, duration_ms
- Track per API key — store `api_key_id` alongside `user_id` so per-key analytics are possible
- Error categorization: **Claude's Discretion** — store an `error_code` string (bounded enum: e.g. `INVALID_PDF`, `TIMEOUT`, `UNKNOWN`) rather than a raw boolean; enables failure analysis by category
- IP/user-agent: **Skip** — not stored; GDPR-conscious default, not needed for planned analytics

### Fire-and-Forget Failure Handling

- Use **Bull/BullMQ with Redis** — durable queue (events survive process restarts)
- Share the **existing Redis instance** — no dedicated connection
- Retry policy: **5 attempts** with exponential backoff, then move to a **dead-letter queue** (not silently discarded)
- Tracking failures must never propagate to the thumbnail response — interceptor always resolves

### Aggregation Granularity

- Response shape: **daily buckets for last N days** — an array of day objects, not all-time totals
- Lookback window: **configurable via `?days=N`** (Claude's decision — Phase 4 analytics page requires date range filtering; backend should expose this from day 1)
- Each daily bucket includes: `date`, `call_count`, `error_count`, `avg_duration_ms`, `unique_api_keys`
- No all-time totals in the response body (frontend can sum if needed)

### Admin Endpoint Scope

- Same `?days=N` query param as user endpoint — admin sees platform-wide daily buckets for the window
- Response includes: platform-wide daily bucket array (same shape as user endpoint) + two ranked lists:
  - Top 10 users by **call volume** (user_id, email or identifier, total calls)
  - Top 10 users by **error count** (user_id, email or identifier, error count)
- Admin endpoint shape is Claude's Discretion for the exact response envelope — keep symmetric with user endpoint

### Claude's Discretion

- Error code enum values and storage type (VARCHAR vs enum column)
- Exact Bull job configuration (concurrency, job timeout)
- Dead-letter queue visibility (e.g. whether to expose a `/api/analytics/admin/dlq` endpoint or just log)
- Default value for `?days=N` (suggest 30 to align with typical subscription billing cycle)
- Whether platform daily bucket array also includes the two ranked lists inline or as separate keys

</decisions>

<specifics>
## Specific Ideas

- The admin endpoint's two ranked lists (top by volume, top by errors) should help spot abuse and heavy consumers at a glance — this is a first-line observability tool, not a full user management view (that's Phase 5)
- Bull/BullMQ chosen specifically for durability — analytics data should be reliable enough to inform business decisions

</specifics>

<deferred>
## Deferred Ideas

- None — discussion stayed within phase scope

</deferred>

---

*Phase: 03-analytics-backend*
*Context gathered: 2026-02-19*
