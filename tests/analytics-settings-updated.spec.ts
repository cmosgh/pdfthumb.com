import { test, expect } from "@playwright/test";

test.describe("Detailed Analytics & Settings", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard before each test
    await page.goto("/dashboard");

    // Open the sidebar on mobile
    const sidebarToggle = page.getByTestId("sidebar-toggle");
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
    }
  });

  test.describe("Analytics Page", () => {
    test("should display detailed analytics charts and data", async ({
      page,
    }) => {
      await page.goto("/dashboard/analytics");
      await expect(page.locator('h1:text("Detailed Analytics")')).toBeVisible();

      // Check for DateRangePicker
      await expect(
        page.locator('[data-testid="date-range-picker"]'),
      ).toBeVisible();

      // Check for charts
      await expect(
        page.locator('[data-testid="error-rate-chart"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="usage-by-file-type-chart"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="geographic-distribution-chart"]'),
      ).toBeVisible();

      // Check for error logs table
      await expect(
        page.locator('[data-testid="error-logs-table"]'),
      ).toBeVisible();
    });

    test("should filter data when a quick date range is selected", async ({
      page,
    }) => {
      await page.goto("/dashboard/analytics");

      // Initial state check (assuming some data is present)
      const initialRowCount = await page
        .locator('[data-testid="error-logs-table"] tbody tr')
        .count();
      expect(initialRowCount).toBeGreaterThan(0);

      // Click on "30 days" button
      await page.click('[data-testid="quick-range-30d"]');

      // Verify date inputs have changed
      const today = new Date();
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);

      const expectedStartDate = thirtyDaysAgo.toISOString().split("T")[0];
      const expectedEndDate = today.toISOString().split("T")[0];

      await expect(
        page.locator('[data-testid="date-start-input"]'),
      ).toHaveValue(expectedStartDate);
      await expect(page.locator('[data-testid="date-end-input"]')).toHaveValue(
        expectedEndDate,
      );
    });
  });

  test.describe("Settings Page", () => {
    test("should display profile and API key sections", async ({ page }) => {
      await page.click('aside a:has-text("Settings")');
      await expect(page.locator('h1:text("Settings")')).toBeVisible();

      // Check for Profile Settings
      await expect(
        page.locator('[data-testid="profile-settings-section"]'),
      ).toBeVisible();

      // Check for API Keys Manager
      await expect(
        page.locator('[data-testid="api-keys-section"]'),
      ).toBeVisible();
    });

    test("should allow editing and saving profile information", async ({
      page,
    }) => {
      await page.goto("/dashboard/settings");

      // Click edit button
      await page.click('[data-testid="edit-profile-button"]');

      // Edit form fields
      const nameInput = page.getByLabel("Full Name");
      const companyInput = page.getByLabel("Company (Optional)");

      await nameInput.fill("John Doe Updated");
      await companyInput.fill("Updated Inc.");

      // Save changes
      await page.click('[data-testid="save-profile-button"]');

      // Verify inputs are disabled and updated
      await expect(nameInput).toBeDisabled();
      await expect(nameInput).toHaveValue("John Doe Updated");
      await expect(companyInput).toHaveValue("Updated Inc.");
    });

    test("should generate and revoke an API key", async ({ page }) => {
      await page.goto("/dashboard/settings");

      // Mock initial API key listing
      await page.route("**/api/api-key", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "existing-key-1",
              name: "Existing Key",
              identifier: "ptk_test_****1234",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              expiresAt: null,
              lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
              enabled: true,
            },
          ]),
        });
      });

      // Reload the page to trigger initial data load
      await page.reload();

      const apiKeysTable = page.locator('[data-testid="api-keys-table"]');

      // Wait for initial keys to load
      await expect(page.locator('td:text("Existing Key")')).toBeVisible();
      const initialKeyCount = await apiKeysTable.locator("tbody tr").count();

      // Mock API calls for key generation
      await page.route("**/api/api-key/generate", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({
            id: "test-key-123",
            name: "Test Key",
            identifier: "ptk_test_****test",
            createdAt: new Date().toISOString(),
            expiresAt: null,
            lastUsedAt: null,
            enabled: true,
          }),
        });
      });

      // Mock API call for key revocation
      await page.route("**/api/api-key/test-key-123", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify({ success: true }),
        });
      });

      // Generate new key
      await page.click('[data-testid="generate-api-key-button"]');
      await page.locator('[data-testid="api-key-name-input"]').fill("Test Key");
      await page.click('[data-testid="generate-api-key-submit"]');

      // Mock the sync call that happens after key generation
      await page.route(
        "**/api/api-key",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
              {
                id: "existing-key-1",
                name: "Existing Key",
                identifier: "ptk_test_****1234",
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                expiresAt: null,
                lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
                enabled: true,
              },
              {
                id: "test-key-123",
                name: "Test Key",
                identifier: "ptk_test_****test",
                createdAt: new Date().toISOString(),
                expiresAt: null,
                lastUsedAt: null,
                enabled: true,
              },
            ]),
          });
        },
        { times: 1 },
      );

      // Verify new key is added
      await expect(apiKeysTable.locator("tbody tr")).toHaveCount(
        initialKeyCount + 1,
      );
      await expect(page.locator('td:text("Test Key")')).toBeVisible();

      // Revoke the newly created key
      const newKeyRow = page.locator('tr:has-text("Test Key")');
      await newKeyRow.locator('[data-testid="revoke-api-key-button"]').click();

      // Accept confirmation dialog
      await page.click('button:text("Revoke Key")');

      // Mock the sync call that happens after key revocation
      await page.route(
        "**/api/api-key",
        async (route) => {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify([
              {
                id: "existing-key-1",
                name: "Existing Key",
                identifier: "ptk_test_****1234",
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                expiresAt: null,
                lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
                enabled: true,
              },
              {
                id: "test-key-123",
                name: "Test Key",
                identifier: "ptk_test_****test",
                createdAt: new Date().toISOString(),
                expiresAt: null,
                lastUsedAt: null,
                enabled: false, // Now revoked
              },
            ]),
          });
        },
        { times: 1 },
      );

      // Verify key is marked as revoked in the status column
      await expect(apiKeysTable.locator("tbody tr")).toHaveCount(
        initialKeyCount + 1,
      );
      await expect(page.locator('td:text("Test Key")')).toBeVisible();

      // Check that the Test Key row specifically shows "Revoked" status in the status column
      const testKeyRow = page.locator('tr:has-text("Test Key")');
      await expect(
        testKeyRow.locator("td").nth(2).locator('span:text("Revoked")'),
      ).toBeVisible();
    });
  });
});
