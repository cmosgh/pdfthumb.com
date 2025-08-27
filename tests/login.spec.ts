import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should navigate to the login page", async ({ page }) => {
    await page.goto("/");
    await page.click("text=Log In");
    await expect(page).toHaveURL("/login");
    await expect(page.locator("h2")).toContainText("Sign in to your account");
  });

  test("should allow a user to sign in", async ({ page }) => {
    await page.goto("/login");
    await page.fill("#email", "test@example.com");
    await page.fill("#password", "password");
    await page.click('button[type="submit"]');
    await expect(page).toHaveURL("/");
  });
});
