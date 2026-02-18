# External Integrations

**Analysis Date:** 2026-02-18

## APIs & External Services

**Google Gemini API:**
- Service: Google Gemini API for PDF thumbnail generation
- What it's used for: PDF processing and thumbnail generation
- SDK/Client: Native fetch (no SDK installed)
- Auth: API key via environment variable `GEMINI_API_KEY`
- Configuration: Injected at build time in `vite.config.ts`
- Location in code: Configured in `vite.config.ts` lines 19-20

**Backend API:**
- Service: Custom backend API
- What it's used for: Authentication, API key management, token refresh
- Endpoint base: `/api` (proxied to localhost:3000 in dev)
- Auth: Bearer token in Authorization header or x-api-key header
- Location: `src/api.ts` contains all API client functions
- Endpoints used:
  - `POST /api/auth/refresh` - Refresh access tokens
  - `POST /api/auth/logout` - Logout and invalidate session
  - `GET /api/api-key` - Fetch user's API keys
  - `POST /api/api-key/generate` - Create new API key
  - `DELETE /api/api-key/{keyId}` - Revoke API key

## Data Storage

**Local Storage (Browser):**
- Type: Client-side persistent storage
- What's stored:
  - `auth_tokens` - Access token, refresh token, and expiration timestamp (JSON)
  - `auth_user` - Authenticated user data (name, email, ID, timestamps)
  - `theme` - User theme preference (light/dark)
- Client: localStorage API (native browser API)
- Location in code: `src/hooks/AuthContext.tsx`, `src/hooks/useTheme.ts`

**TanStack DB (Local Collections):**
- Type: In-memory local database
- Collections:
  - `dashboardSummary` - Summary metrics (total PDFs, thumbnails, API calls)
  - `usageTrends` - Time-series usage data
  - `fileTypeData` - File type distribution
  - `errorLogs` - Application error logs
  - `geographicData` - Geographic distribution of requests
  - `userProfile` - User profile information
  - `apiKeys` - User's generated API keys
  - `detailedAnalytics` - Aggregated analytics metrics
- Client: @tanstack/db with @tanstack/react-db
- Storage: Local-only (in-memory, no persistence to backend)
- Location: `src/db.ts` defines all collections and initialization
- Initialization: Mock data loaded on app startup via `dbHelpers.initializeWithMockData()`

**File Storage:**
- Type: Local filesystem only
- No cloud file storage integrated
- Thumbnails and PDFs handled by backend API

**Caching:**
- React Query cache: 5-minute stale time, 3 automatic retries
- Configured in `src/queryClient.ts`
- No persistent cache layer (Redis, etc.)

## Authentication & Identity

**Auth Provider:**
- Type: OAuth-style callback-based authentication
- OAuth Callback Handler: `src/routes/auth/callback.tsx`
- How it works:
  1. User redirected to OAuth provider (backend determines provider)
  2. OAuth provider redirects to `/auth/callback` with tokens in URL params
  3. Frontend extracts `accessToken`, `refreshToken`, `expiresIn`, `user` from query params
  4. Tokens and user stored in localStorage
  5. User navigated to dashboard
- Token Management:
  - Access token expiration check: 1 minute buffer before refresh
  - Refresh endpoint: `POST /api/auth/refresh` (requires refreshToken)
  - Logout endpoint: `POST /api/auth/logout`
- Implementation: `src/hooks/AuthContext.tsx` with React Context API
- Storage: localStorage with keys `auth_tokens` and `auth_user`

**Custom Auth Context:**
- Location: `src/hooks/AuthContext.tsx`
- Exports: `useAuth()` hook and `AuthProvider` component
- State tracked:
  - `user` - Authenticated user object
  - `tokens` - Access and refresh tokens
  - `isAuthenticated` - Boolean flag
  - `isLoading` - Initial load state
- Methods:
  - `login(tokens, user)` - Store auth data
  - `logout()` - Clear auth and redirect to home
  - `refreshToken()` - Refresh access token via backend

## Monitoring & Observability

**Error Tracking:**
- Type: Not integrated (logging only)
- Local error logs stored in TanStack DB `errorLogs` collection
- Console logging for debugging

**Logs:**
- Approach: Browser console logging
- Log locations:
  - Authentication flow: `src/hooks/AuthContext.tsx`
  - API calls: `src/api.ts`
  - OAuth callback: `src/routes/auth/callback.tsx`
- No centralized log aggregation

## CI/CD & Deployment

**Hosting:**
- Type: Docker containerization (multi-stage)
- Build stage: Node 22 Alpine
- Runtime stage: Nginx Alpine
- Output: Static SPA served from Nginx at `/usr/share/nginx/html`
- Dockerfile location: `/Dockerfile` (multi-stage build)

**Build Pipeline:**
- Platform: GitHub Actions
- Workflows:
  - `build.yml` - Build workflow (location: `.github/workflows/build.yml`)
  - `playwright.yml` - E2E testing (location: `.github/workflows/playwright.yml`)
- E2E Test Configuration:
  - Runner: Playwright on ubuntu-latest
  - Node: LTS version
  - Test directory: `./tests`
  - Base URL: http://localhost:4173 (preview server)
  - Screenshots: Captured on test failure only
  - Trace: Collected on first retry
  - Browser coverage: Chromium, Firefox, WebKit
  - Report: Uploaded as artifact (10 day retention)

## Environment Configuration

**Required env vars (build-time):**
- `GEMINI_API_KEY` - Google Gemini API key (or `API_KEY` as fallback)
- `API_URL` - Backend API base URL
- `TEST_API_KEY` - API key for development testing (dev mode only)

**Optional env vars:**
- `CI` - Detects CI environment (GitHub Actions)
- `NODE_ENV` - Development/production flag

**Secrets location:**
- `.env` - Environment variables (committed)
- `.env.local` - Local overrides (not committed)
- Variables injected by Vite at build time using `loadEnv(mode, ".", "")`
- No serverside .env secrets (this is frontend-only)

## Webhooks & Callbacks

**Incoming:**
- OAuth Callback: `/auth/callback` - Receives tokens and user data from backend OAuth handler
- Callback parameter format:
  - `accessToken` or `token` - Bearer token for API auth
  - `refreshToken` - Token for refreshing access token
  - `expiresIn` or `expires_in` - Token lifetime in seconds
  - `user` - JSON-encoded user object (optional, fallback to generic user)

**Outgoing:**
- None detected - Frontend only calls backend REST APIs
- No webhook emission to external services

## Data Flow Summary

1. **Authentication:**
   - User initiates login → Backend redirects to OAuth provider
   - OAuth provider → Backend handles exchange → Redirects to `/auth/callback` with tokens
   - Frontend stores tokens in localStorage, initializes React Query

2. **API Requests:**
   - Frontend calls `/api/*` endpoints via fetch
   - Auth header: `Authorization: Bearer {accessToken}` or `x-api-key: {testKey}`
   - Token refresh handled automatically before expiration

3. **Data Storage:**
   - Dashboard data loaded to TanStack DB collections on app init
   - Real API keys synced via `dbHelpers.syncApiKeys(token)`
   - User preferences (theme) persisted to localStorage

---

*Integration audit: 2026-02-18*
