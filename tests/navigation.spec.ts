import { test, expect } from "@playwright/test";

test.describe("Navigation", () => {
  test.describe("from index page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    test("should navigate to features section", async ({ page, isMobile }) => {
      if (isMobile) {
        await page.getByLabel("Toggle mobile menu").click();
        await page
          .getByLabel("Mobile Menu")
          .getByRole("link", { name: "Features" })
          .click();
      } else {
        await page
          .getByRole("navigation")
          .getByRole("link", { name: "Features" })
          .click();
      }
      await expect(page).toHaveURL("/#features");
      await expect(page.locator("#features")).toBeVisible();
    });

    test("should navigate to the pricing page", async ({ page, isMobile }) => {
      if (isMobile) {
        await page.getByLabel("Toggle mobile menu").click();
        await page
          .getByLabel("Mobile Menu")
          .getByRole("link", { name: "Pricing" })
          .click();
      } else {
        await page
          .getByRole("navigation")
          .getByRole("link", { name: "Pricing" })
          .click();
      }
      // Pricing has its own page (#141).
      await expect(page).toHaveURL("/pricing");
      await expect(page.locator("h1")).toHaveText("Pricing");
    });
  });

  test.describe("from login page", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/login");
    });

    test("should navigate to features section", async ({ page, isMobile }) => {
      if (isMobile) {
        await page.getByLabel("Toggle mobile menu").click();
        await page
          .getByLabel("Mobile Menu")
          .getByRole("link", { name: "Features" })
          .click();
      } else {
        await page
          .getByRole("navigation")
          .getByRole("link", { name: "Features" })
          .click();
      }
      await expect(page).toHaveURL("/#features");
      await expect(page.locator("#features")).toBeVisible();
    });

    test("should navigate to the pricing page", async ({ page, isMobile }) => {
      if (isMobile) {
        await page.getByLabel("Toggle mobile menu").click();
        await page
          .getByLabel("Mobile Menu")
          .getByRole("link", { name: "Pricing" })
          .click();
      } else {
        await page
          .getByRole("navigation")
          .getByRole("link", { name: "Pricing" })
          .click();
      }
      // Pricing has its own page (#141).
      await expect(page).toHaveURL("/pricing");
      await expect(page.locator("h1")).toHaveText("Pricing");
    });
  });
});
