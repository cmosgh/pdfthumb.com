import { test, expect } from "@playwright/test";

test.describe("Login Page", () => {
  test("should navigate to the login page", async ({ page, isMobile }) => {
    await page.goto("/");

    if (isMobile) {
      // Click the mobile menu button
      await page.getByLabel("Toggle mobile menu").click();
      // Click the Log In link within the mobile menu
      await page
        .locator('nav[aria-label="Mobile Menu"]')
        .getByText("Log In")
        .click();
    } else {
      await page.click("text=Log In");
    }
    await expect(page).toHaveURL("/login");
    await page.waitForSelector('h2:has-text("Sign in to your account")');
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
