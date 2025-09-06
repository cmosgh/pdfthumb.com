import { test, expect } from "@playwright/test";

test.describe("Detailed Analytics & Settings", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the dashboard before each test
    await page.goto("/dashboard");
  });

  test.describe("Analytics Page", () => {
    test("should display detailed analytics charts and data", async ({
      page,
    }) => {
      await page.click('aside a:has-text("Analytics")');
      await expect(
        page.locator('h1:text("Detailed Analytics")'),
      ).toBeVisible();

      // Check for DateRangePicker
      await expect(page.locator('[data-testid="date-range-picker"]')).toBeVisible();

      // Check for charts
      await expect(page.locator('[data-testid="error-rate-chart"]')).toBeVisible();
      await expect(
        page.locator('[data-testid="usage-by-file-type-chart"]'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="geographic-distribution-chart"]'),
      ).toBeVisible();

      // Check for error logs table
      await expect(page.locator('[data-testid="error-logs-table"]')).toBeVisible();
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

      await expect(page.locator('[data-testid="date-start-input"]')).toHaveValue(
        expectedStartDate,
      );
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
      await expect(page.locator('[data-testid="api-keys-section"]')).toBeVisible();
    });

    test("should allow editing and saving profile information", async ({
      page,
    }) => {
      await page.goto("/dashboard/settings");

      // Click edit button
      await page.click('[data-testid="edit-profile-button"]');

      // Edit form fields
      const nameInput = page.getByLabel('Full Name');
      const companyInput = page.getByLabel('Company (Optional)');

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

      const apiKeysTable = page.locator('[data-testid="api-keys-table"]');
      const initialKeyCount = await apiKeysTable.locator("tbody tr").count();

      // Generate new key
      await page.click('[data-testid="generate-api-key-button"]');
      await page
        .locator('[data-testid="api-key-name-input"]')
        .fill("Test Key");
      await page.click('[data-testid="generate-api-key-submit"]');

      // Verify new key is added
      await expect(apiKeysTable.locator("tbody tr")).toHaveCount(
        initialKeyCount + 1,
      );
      await expect(
        page.locator('td:text("Test Key")'),
      ).toBeVisible();

      // Accept confirmation dialog
      page.on("dialog", (dialog) => dialog.accept());

      // Revoke the newly created key
      const newKeyRow = page.locator('tr:has-text("Test Key")');
      await newKeyRow.locator('button:text("Revoke")').click();

      // Verify key is marked as revoked
      await expect(
        newKeyRow.locator('span.rounded-full:text("Revoked")'),
      ).toBeVisible();
    });
  });
});