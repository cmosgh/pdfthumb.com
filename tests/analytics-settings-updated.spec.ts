import { test, expect } from "@playwright/test";
import { mockAuthentication } from "./auth-helper";

test.describe("Detailed Analytics & Settings", () => {
  test.beforeEach(async ({ page }) => {
    // Mock authentication before each test
    await mockAuthentication(page);

    // Navigate to the dashboard before each test
    await page.goto("/dashboard");

    // Open the sidebar on mobile
    const sidebarToggle = page.getByTestId("sidebar-toggle");
    if (await sidebarToggle.isVisible()) {
      await sidebarToggle.click();
    }
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

    // The profile shows the signed-in user (#77): mockAuthentication signs
    // in "Test User" <test@example.com>.
    test("shows the signed-in user's name and email", async ({ page }) => {
      await page.goto("/dashboard/settings");

      const profile = page.getByTestId("profile-settings-section");
      await expect(profile.getByTestId("profile-name")).toHaveText("Test User");
      await expect(profile.getByTestId("profile-email")).toHaveText(
        "test@example.com",
      );
    });

    test("shows no placeholder profile and nothing the backend lacks", async ({
      page,
    }) => {
      await page.goto("/dashboard/settings");

      const profile = page.getByTestId("profile-settings-section");
      await expect(profile.getByTestId("profile-name")).toHaveText("Test User");
      for (const placeholder of [
        "John Doe",
        "john.doe@example.com",
        "Acme Corp",
        "June 15, 2023",
        "Account Created",
        "Company",
        "Last Updated",
      ]) {
        await expect(profile).not.toContainText(placeholder);
      }
      // No backend endpoint saves a profile, so nothing offers to.
      await expect(page.getByTestId("edit-profile-button")).toHaveCount(0);
      await expect(page.getByTestId("save-profile-button")).toHaveCount(0);
    });

    // #163: no backend endpoint deletes an account, so nothing offers to,
    // and nothing is written in its place.
    test("offers no account deletion", async ({ page }) => {
      await page.goto("/dashboard/settings");
      await expect(page.getByTestId("profile-settings-section")).toBeVisible();
      await expect(page.getByTestId("danger-zone-section")).toHaveCount(0);
      await expect(page.getByTestId("delete-account-button")).toHaveCount(0);
      // The dashboard's own <main> sits inside the site's.
      await expect(page.locator("main main")).not.toContainText(/delete/i);
    });

    // #165: no email is ever sent (there's no mail provider), so nothing
    // offers email notifications or usage alerts.
    test("offers no notification settings", async ({ page }) => {
      await page.goto("/dashboard/settings");
      await expect(page.getByTestId("profile-settings-section")).toBeVisible();
      await expect(
        page.getByTestId("notification-preferences-section"),
      ).toHaveCount(0);
      await expect(page.locator("main main")).not.toContainText(
        /notification|alert/i,
      );
    });

    test("says Not provided when Google gave no name or email", async ({
      page,
    }) => {
      // Overrides the user mockAuthentication stored for this page load.
      await page.addInitScript(() => {
        const user = JSON.parse(localStorage.getItem("auth_user") ?? "{}");
        localStorage.setItem(
          "auth_user",
          JSON.stringify({ ...user, name: "", email: "" }),
        );
      });
      await page.goto("/dashboard/settings");

      const profile = page.getByTestId("profile-settings-section");
      await expect(profile.getByTestId("profile-name")).toHaveText(
        "Not provided",
      );
      await expect(profile.getByTestId("profile-email")).toHaveText(
        "Not provided",
      );
    });

    test("should generate and revoke an API key", async ({ page }) => {
      await page.goto("/dashboard/settings");
      // goto returns at the load event, which can come before the lazy route
      // chunks finish; a reload that aborts them makes TanStack reload the
      // page itself, and in Firefox that cancels the test's reload.
      await expect(page.locator('h1:text("Settings")')).toBeVisible();

      // Mock initial API key listing
      await page.route("**/api/api-key", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "existing-key-1",
              name: "Existing Key",
              identifier: "ptk_********1234",
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
            apiKey: "ptk_test_full_key_example",
            createdAt: new Date().toISOString(),
          }),
        });
      });

      // Mock API call for key revocation
      await page.route("**/api/api-key/test-key-123", async (route) => {
        if (route.request().method() === "DELETE") {
          await route.fulfill({
            status: 200,
            contentType: "application/json",
            body: JSON.stringify({ success: true }),
          });
        }
      });

      // Generate new key
      await page.click('[data-testid="generate-api-key-button"]');
      await page.locator('[data-testid="api-key-name-input"]').fill("Test Key");
      await page.click('[data-testid="generate-api-key-submit"]');

      // Verify the API key generated dialog appears
      await expect(
        page.locator('[data-testid="api-key-generated-dialog"]'),
      ).toBeVisible();
      await expect(
        page.locator('h3:text("API Key Generated Successfully")'),
      ).toBeVisible();
      await expect(
        page.locator('[data-testid="api-key-generated-dialog"] code'),
      ).toContainText("ptk_********mple");

      // Test copy functionality (basic test - just click the button)
      await page.click('button:text("Copy to Clipboard")');

      // Close the dialog
      await page.click('button:text("Close")');

      // Mock the sync call that happens after dialog closes and key is added
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
                identifier: "ptk_********1234",
                createdAt: new Date(Date.now() - 86400000).toISOString(),
                expiresAt: null,
                lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
                enabled: true,
              },
              {
                id: "test-key-123",
                name: "Test Key",
                identifier: "ptk_********test",
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

      // Verify new key is added to the table
      await expect(apiKeysTable.locator("tbody tr")).toHaveCount(
        initialKeyCount + 1,
      );
      await expect(page.locator('td:text("Test Key")')).toBeVisible();

      // Mock the sync call that happens after key revocation
      await page.route("**/api/api-key", async (route) => {
        await route.fulfill({
          status: 200,
          contentType: "application/json",
          body: JSON.stringify([
            {
              id: "existing-key-1",
              name: "Existing Key",
              identifier: "ptk_********1234",
              createdAt: new Date(Date.now() - 86400000).toISOString(),
              expiresAt: null,
              lastUsedAt: new Date(Date.now() - 3600000).toISOString(),
              enabled: true,
            },
            {
              id: "test-key-123",
              name: "Test Key",
              identifier: "ptk_********test",
              createdAt: new Date().toISOString(),
              expiresAt: null,
              lastUsedAt: null,
              enabled: false, // Now revoked
            },
          ]),
        });
      });

      // Revoke the newly created key
      const newKeyRow = page.locator('tr:has-text("Test Key")');
      await newKeyRow.locator('[data-testid="revoke-api-key-button"]').click();

      // Accept confirmation dialog
      await page.click('button:text("Revoke Key")');

      // Wait for the table to update with the revoked key
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
