# Codebase Concerns

**Analysis Date:** 2026-02-18

## Security Concerns

**Untrusted URL Parameter Parsing in OAuth Callback:**
- Issue: User data is decoded and parsed directly from URL parameters without validation
- Files: `src/routes/auth/callback.tsx` (line 53)
- Risk: Malformed or malicious JSON in `user` URL parameter could cause parsing errors or unexpected behavior. Potential for XSS if the parsed data is not properly sanitized before use
- Current mitigation: Basic try-catch blocks, JSON.parse errors are caught
- Recommendations:
  - Validate OAuth response structure against a schema (e.g., using Zod)
  - Sanitize user data before storing in context
  - Consider moving OAuth callback validation to backend-first approach

**localStorage Used for Sensitive Authentication Tokens:**
- Issue: JWT tokens are stored in localStorage without httpOnly flag (frontend only)
- Files: `src/hooks/AuthContext.tsx` (lines 44-45, 116, etc.)
- Risk: XSS attacks can steal tokens from localStorage. Tokens persist across browser sessions with no automatic expiration enforcement
- Current mitigation: Tokens are checked for expiration on app load (1-minute buffer)
- Recommendations:
  - Implement server-side session management with httpOnly cookies
  - If localStorage is necessary, store only non-sensitive values (session ID, not full tokens)
  - Add automatic token rotation on every API request
  - Implement CSRF protection

**Missing CORS/CSRF Protection:**
- Issue: Vite proxy config allows wildcard CORS headers ("Access-Control-Allow-Origin": "*")
- Files: `vite.config.ts` (lines 46-47)
- Risk: Development config could leak into production, making app vulnerable to CSRF attacks and unauthorized API calls
- Current mitigation: This is dev-only, but easy to accidentally use in production build
- Recommendations:
  - Remove wildcard CORS headers from production config
  - Use environment-specific proxy configurations
  - Implement SameSite cookie attribute

**Test API Key Exposed in Environment:**
- Issue: TEST_API_KEY is embedded in Vite build defines
- Files: `vite.config.ts` (line 22)
- Risk: Test API keys could be exposed in bundle source maps or network requests
- Recommendations:
  - Keep test keys separate from production build
  - Only inject TEST_API_KEY in development mode
  - Consider using separate .env files for test/dev/prod

## Tech Debt

**Incomplete Payment Integration:**
- Issue: `handleInitiateCheckout` is a placeholder showing alerts instead of real payment
- Files: `src/paymentUtils.ts`
- Impact: Payment functionality is non-functional; users cannot actually upgrade plans
- Fix approach: Implement actual Stripe integration with proper session creation, redirect flow, and webhook handling

**Mock Data Initialization Blocking App Startup:**
- Issue: App initialization waits for `dbHelpers.initializeWithMockData()` before rendering
- Files: `src/main.tsx` (lines 18-30), `src/db.ts` (lines 89-139)
- Impact: App startup is delayed while inserting mock data; could cause timeouts in slow environments
- Fix approach:
  - Move mock data initialization to lazy loading or separate request
  - Use a loading screen while data initializes
  - Consider pre-populating test data in test mode only

**Database Sync Logic Using Insert-Then-Delete Pattern:**
- Issue: API key sync tries to insert, then on error deletes and re-inserts
- Files: `src/db.ts` (lines 142-169)
- Impact: Inefficient and could lose data if delete succeeds but re-insert fails; no transaction support
- Fix approach:
  - Implement proper upsert logic in TanStack DB
  - Add transaction-like behavior or batch operations
  - Add retry logic with exponential backoff

**Hardcoded API Timeout (2 seconds):**
- Issue: API key fetch has a hardcoded 2-second timeout
- Files: `src/api.ts` (line 76)
- Impact: Slow networks or high-latency backends will fail with timeout; no configuration option
- Fix approach: Make timeout configurable via environment variable; increase default to at least 10 seconds

**Missing Input Validation:**
- Issue: No validation on user form inputs or API request payloads
- Files: `src/routes/dashboard/settings.tsx` (lines 53-62), `src/components/dashboard/ProfileSettingsForm.tsx`, `src/api.ts`
- Impact: Invalid data could be submitted to backend; no client-side feedback
- Fix approach: Use Zod schemas for all user inputs and API payloads

## Testing Gaps

**No Unit Tests for Core Logic:**
- What's not tested: Auth context logic, token refresh mechanism, API error handling
- Files: `src/hooks/AuthContext.tsx`, `src/api.ts`, `src/db.ts`
- Risk: Token refresh edge cases, auth state corruption, race conditions undetected
- Priority: High

**Only E2E Tests with Limited Coverage:**
- What's not tested: Error scenarios, auth token expiration, failed API calls, offline mode
- Files: `tests/` directory contains only basic happy-path tests
- Test coverage: Navigation, login flow, basic dashboard - no error states
- Priority: High

**No API Integration Tests:**
- What's not tested: API timeout behavior, malformed responses, authentication failures
- Files: `src/api.ts`
- Risk: API failures could crash the app unexpectedly
- Priority: Medium

**Dashboard Components Not Tested:**
- What's not tested: Chart rendering, data updates, user interactions (generate key, revoke key, edit profile)
- Files: `src/components/dashboard/`, `src/routes/dashboard/`
- Risk: UI regressions, broken interactions
- Priority: Medium

## Performance Bottlenecks

**Query Client Retries Enabled for All Queries:**
- Problem: React Query retries failed requests 3 times by default
- Files: `src/queryClient.ts` (line 7)
- Cause: No selective retry logic; all failures are retried equally
- Improvement path:
  - Implement custom retry logic based on error type
  - Don't retry on 4xx errors (client error)
  - Only retry on 5xx and network errors

**Large Dashboard Component (307 lines):**
- Problem: ApiKeysManager is one of the largest components, mixing logic and UI
- Files: `src/components/dashboard/ApiKeysManager.tsx`
- Cause: No separation of concerns; logic and UI tightly coupled
- Improvement path:
  - Extract API key state management into a custom hook
  - Split into smaller sub-components (KeysList, GenerateKeyForm, etc.)
  - Consider using state machine for complex interactions

**No Code Splitting for Dashboard Routes:**
- Problem: Dashboard is rendered as single chunk despite Vite auto code-splitting
- Files: `src/routes/dashboard/`, `vite.config.ts` has `autoCodeSplitting: true`
- Cause: Routes may not be lazy-loaded
- Improvement path:
  - Verify lazy route loading is working
  - Monitor bundle size in build output
  - Consider explicit route-level code splitting

**Synchronous localStorage Operations:**
- Problem: localStorage reads/writes block main thread
- Files: `src/hooks/AuthContext.tsx` (multiple locations)
- Cause: No debouncing or batching of localStorage operations
- Improvement path:
  - Batch multiple localStorage writes
  - Consider using IndexedDB for larger data sets
  - Move to service worker for background sync

## Fragile Areas

**Authentication State Management:**
- Files: `src/hooks/AuthContext.tsx`
- Why fragile: Complex state with multiple localStorage operations, JSON parsing, and error handling scattered throughout. Token expiration logic interacts with refresh logic in non-obvious ways
- Safe modification:
  - Add comprehensive unit tests before refactoring
  - Use Zod for auth state validation
  - Consider using a state machine (xstate) to model auth flows
- Test coverage: No unit tests; only basic E2E login test

**OAuth Callback Handler:**
- Files: `src/routes/auth/callback.tsx`
- Why fragile: Relies on URL parameters for auth tokens; uses try-catch but doesn't validate structure; has magic timeout (100ms) before navigation
- Safe modification:
  - Extract token validation to separate, testable function
  - Add schema validation for OAuth response
  - Document the OAuth flow from backend
- Test coverage: Not tested in isolation

**API Key Management Logic:**
- Files: `src/db.ts` (sync logic), `src/components/dashboard/ApiKeysManager.tsx`, `src/routes/dashboard/settings.tsx`
- Why fragile: Complex interaction between local DB, API, and React state. Insert-then-delete pattern is error-prone. No error recovery for partial updates
- Safe modification:
  - Extract sync logic to a service layer
  - Add comprehensive error handling with user feedback
  - Test sync scenarios with network failures
- Test coverage: No unit tests; only basic E2E test

## Missing Features with High Impact

**Token Refresh Mechanism:**
- Problem: No automatic token refresh before expiration; manual refresh only on demand
- Impact: Sessions will expire unexpectedly if user is inactive for >1 hour
- Blocks: Background sync, long-running API operations, scheduled tasks

**Proper Error Handling and User Feedback:**
- Problem: Errors logged to console; no user-facing error messages
- Files: All API calls in `src/api.ts`, `src/db.ts`
- Impact: Users don't know why operations fail; poor UX
- Blocks: User trust, debugging support requests

**API Key Masking at Rest:**
- Problem: Full API keys stored in localStorage/local DB
- Files: `src/data/dashboardMocks.ts` shows mask but real implementation doesn't mask
- Impact: If local DB is compromised, all API keys are exposed
- Blocks: Secure credential storage

## Scaling Limits

**Local Database Storage:**
- Current capacity: Limited by browser localStorage (typically 5-10MB)
- Limit: App will fail to sync large datasets or many API keys
- Scaling path:
  - Migrate to IndexedDB (hundreds of MB available)
  - Implement pagination for API keys and analytics
  - Add local database cleanup for old data

**Console Logging in Production:**
- Current: 26 console.log/warn/error calls throughout codebase
- Impact: Verbose debugging output in production; security info leaked (request URLs, token refresh errors)
- Scaling path:
  - Implement proper logging service
  - Disable debug logs in production
  - Use structured logging for error tracking

**Vite Build Warnings:**
- Current: Build suppresses "use client" warnings
- Impact: Could hide real issues; suppressions could mask needed refactoring
- Scaling path:
  - Clean up "use client" directives
  - Only suppress legitimate warnings
  - Monitor build output

## Dependencies at Risk

**React 19 (Recent Release):**
- Risk: Relatively new version; potential stability issues
- Impact: Ecosystem compatibility, bug fixes
- Mitigation: Lock to ^19.1.0; monitor for patch releases
- Migration plan: Track stable releases; plan upgrade cycles

**TanStack Router (1.132.x) - Not Stable:**
- Risk: Early stage framework; API could change
- Impact: Route structure may need refactoring
- Mitigation: Pin version; document custom routing patterns
- Migration plan: Evaluate alternatives (React Router, Next.js routing)

**TanStack DB (0.4.1) - Experimental:**
- Risk: Experimental package; could be abandoned or restructured
- Impact: Local data persistence strategy may need to change
- Mitigation: Wrap in abstraction layer; don't tightly couple to API
- Migration plan: Consider alternatives (Zustand + localStorage, dexie.js, pouchdb)

---

*Concerns audit: 2026-02-18*
