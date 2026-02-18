# Testing Patterns

**Analysis Date:** 2026-02-18

## Test Framework

**Runner:**
- Playwright 1.56.1 (`@playwright/test`)
- Config: `playwright.config.ts`

**Assertion Library:**
- Playwright built-in assertions (e.g., `expect()`, `toBeVisible()`, `toHaveCount()`)

**Run Commands:**
```bash
npm test                    # Run all Playwright tests (equivalent to: npx playwright test)
npm run build && npm run preview  # Build and serve app for tests (run via webServer in config)
```

## Test File Organization

**Location:**
- E2E tests: `/tests/` directory (separate from source code)
- Setup helpers: `/tests/auth-helper.ts`
- Test files co-located in tests folder, not alongside components

**Naming:**
- `.spec.ts` extension for all test files (e.g., `index.spec.ts`, `dashboard.spec.ts`)
- Descriptive test names matching feature tested

**Structure:**
```
tests/
├── auth-helper.ts              # Shared authentication mock utilities
├── index.spec.ts               # Landing page tests
├── navigation.spec.ts          # Navigation and routing tests
├── dashboard.spec.ts           # Dashboard functionality tests
├── login.spec.ts               # Login flow tests
├── branding-consistency.spec.ts # Visual consistency tests
└── analytics-settings-updated.spec.ts # Analytics settings tests
```

## Test Structure

**Suite Organization:**
```typescript
test.describe("Feature Name", () => {
  test.beforeEach(async ({ page }) => {
    // Setup before each test
    await mockAuthentication(page);
  });

  test("should do specific action", async ({ page }) => {
    // Arrange
    await page.goto("/path");

    // Act & Assert
    await expect(page.locator("selector")).toBeVisible();
  });
});
```

**Patterns:**

1. **Setup Pattern:**
   - Use `test.beforeEach()` for test-specific setup (e.g., mock authentication)
   - Authentication setup: `await mockAuthentication(page)` from `auth-helper.ts`
   - Navigation setup: `await page.goto(url)` with baseURL from config

2. **Teardown Pattern:**
   - Implicit via Playwright test isolation (fresh context per test)
   - Manual cleanup available via `test.afterEach()` if needed
   - Authentication teardown: `await clearAuthentication(page)` for logout tests

3. **Assertion Pattern:**
   - Locator-based assertions using `page.getByRole()`, `page.getByTestId()`, `page.locator()`
   - Visibility checks: `expect(locator).toBeVisible()`
   - Existence checks: `expect(locator).not.toBeNull()`
   - Count checks: `expect(locators).toHaveCount(n)`
   - Text content: `expect(locator).toContainText(text)`
   - Loop assertions for multiple similar elements (see `dashboard.spec.ts` lines 95-112)

## Mocking

**Framework:** Playwright `addInitScript()` for client-side state mocking

**Patterns:**
```typescript
// Mock authentication helper in auth-helper.ts
export async function mockAuthentication(page: Page): Promise<void> {
  await page.addInitScript(() => {
    localStorage.setItem("auth_tokens", JSON.stringify({...}));
    localStorage.setItem("auth_user", JSON.stringify({...}));
  });
}

// Usage in tests
test.beforeEach(async ({ page }) => {
  await mockAuthentication(page);
});
```

**What to Mock:**
- Authentication state (tokens and user info stored in localStorage)
- Replaces need for actual OAuth login during tests
- Mock data defined in `auth-helper.ts`:
  - `mockUser`: Test user object with id, email, name, picture
  - `mockTokens`: Test tokens with accessToken, refreshToken, expiresAt
  - Expiry set to future time (1 hour + 5 minute buffer) to ensure valid tokens

**What NOT to Mock:**
- UI elements and DOM structure
- API responses for integration tests (use real API or backend test server)
- Network requests when testing error handling
- Page navigation and routing

## Fixtures and Factories

**Test Data:**
```typescript
// From auth-helper.ts - reusable test fixtures
export const mockUser: MockUser = {
  id: "test-user-123",
  email: "test@example.com",
  name: "Test User",
  picture: "https://example.com/avatar.jpg",
};

export const mockTokens: MockTokens = {
  accessToken: "mock-access-token",
  refreshToken: "mock-refresh-token",
  expiresAt: Date.now() + 3600000 + 300000,
};
```

**Location:**
- Shared fixtures: `tests/auth-helper.ts`
- Test-specific data: Defined inline in `.spec.ts` files
- Data from application constants: Imported directly (e.g., `import { PRICING_TIERS } from "@/constants.ts"`)

## Coverage

**Requirements:** Not enforced (no coverage configuration detected)

**View Coverage:**
- Not currently available in test configuration
- Playwright provides basic test execution reports

## Test Types

**Unit Tests:**
- Not detected in codebase
- Testing would be component or function-level using different framework (Jest/Vitest)
- Current setup focuses on E2E tests only

**Integration Tests:**
- Tested via E2E: Authentication flow with localStorage and API
- Database collection operations mocked in components, actual tested end-to-end
- API integration tested with real backend endpoints

**E2E Tests:**
- Framework: Playwright
- Scope: Full user workflows from browser perspective
- Examples:
  - User login and dashboard access
  - Navigation between app sections
  - Pricing page rendering with correct tiers
  - Responsive design on mobile viewports

## Common Patterns

**Async Testing:**
```typescript
// From index.spec.ts - waiting for async operations
test("should show annual prices when toggled", async ({ page }) => {
  await page.goto(BASE_URL);
  const toggle = await page.getByRole("button", { name: /annually/i });
  await toggle.click();
  // Assertions wait for promise resolution automatically
  await expect(page.getByText(/price/)).toBeVisible();
});
```

**Error Testing:**
```typescript
// From dashboard.spec.ts - testing element absence/error states
test("should not display sidebar on mobile by default", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/dashboard");

  const sidebar = page.locator("aside");
  await expect(sidebar).not.toBeInViewport();
});
```

**Responsive Testing:**
```typescript
// From dashboard.spec.ts - testing different viewports
test("should be responsive on mobile", async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto("/dashboard");

  // Mobile-specific assertions
  await expect(page.locator("div.md\\:hidden button").first()).toBeVisible();
});
```

**Data-Driven Testing:**
```typescript
// From index.spec.ts - loop over test constants
test("should render correct pricing tiers", async ({ page }) => {
  await page.goto(BASE_URL);
  const tiers = PRICING_TIERS;

  for (const tier of tiers) {
    await expect(
      page.getByRole("heading", { name: tier.name })
    ).toBeVisible();
  }
});
```

## Playwright Configuration Details

**Base URL:** `http://localhost:4173` (preview server)

**Test Execution:**
- `timeout: 30 * 1000` - 30 second test timeout
- `fullyParallel: true` - Tests run in parallel (disabled on CI)
- `forbidOnly: true` on CI - Fails build if `test.only` left in code
- `retries: 2` on CI only - Flaky test handling on CI

**Test ID Attribute:**
- `testIdAttribute: "data-testid"` configured
- Components use `data-testid` for reliable element selection
- Examples: `data-testid="pricing-card-${tier.id}"`, `data-testid="metric-card"`

**Reporters:**
- CI: "dot" - Minimal output
- Local: "list" - Verbose test list

**Screenshots & Traces:**
- `screenshot: "only-on-failure"` - Captures failed test states
- `trace: "on-first-retry"` - Records trace for debugging retries

**Webserver:**
```typescript
webServer: {
  command: "npm run build && npm run preview",
  url: "http://localhost:4173",
  reuseExistingServer: true,  // Reuse if already running
}
```

**Browsers Tested:**
- Chromium (Desktop)
- Firefox (Desktop)
- WebKit/Safari (Desktop)
- Mobile viewports: Commented out but available

---

*Testing analysis: 2026-02-18*
