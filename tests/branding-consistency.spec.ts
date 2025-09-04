import { expect, test } from "@playwright/test";
import { APP_NAME } from "@/constants.ts";

test.describe("Branding Consistency", () => {
  test.describe("Header Branding", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
    });

    test("should display correct brand name on mobile", async ({
      page,
      isMobile,
    }) => {
      test.skip(!isMobile, "This test is for mobile only");
      const headerBrand = page.getByTestId("header-mobile-link");
      await expect(headerBrand).toBeVisible();
      await expect(headerBrand).toContainText(APP_NAME.replace(".com", ""));
    });

    test("should display correct brand name on desktop", async ({
      page,
      isMobile,
    }) => {
      test.skip(isMobile, "This test is for desktop only");
      const headerBrand = page.getByTestId("header-desktop-link");
      await expect(headerBrand).toBeVisible();
      await expect(headerBrand).toContainText(APP_NAME);
    });
  });

  test.describe("Footer Branding", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    });

    test("should display correct brand name", async ({ page }) => {
      const footerBrand = page
        .locator("footer")
        .getByText(APP_NAME, { exact: true, visible: true });
      await expect(footerBrand).toBeVisible();
      await expect(footerBrand).toHaveText(APP_NAME);
    });

    test(`copyright notice should include ${APP_NAME}`, async ({ page }) => {
      const currentYear = new Date().getFullYear();
      const copyrightText = `© ${currentYear} ${APP_NAME}. All rights reserved.`;
      const footer = page.locator("footer");
      await expect(footer).toContainText(copyrightText);
    });
  });

  test("brand consistency across all pages", async ({ page, isMobile }) => {
    const pages = ["/", "/features", "/pricing"];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Check header
      if (isMobile) {
        const headerBrand = page.getByTestId("header-mobile-link");
        await expect(headerBrand).toBeVisible();
        await expect(headerBrand).toContainText(APP_NAME.replace(".com", ""));
      } else {
        const headerBrand = page.getByTestId("header-desktop-link");
        await expect(headerBrand).toBeVisible();
        await expect(headerBrand).toContainText(APP_NAME);
      }

      // Check footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const footerBrand = page
        .locator("footer")
        .getByText(APP_NAME, { exact: true, visible: true });
      await expect(footerBrand).toBeVisible();
      await expect(footerBrand).toHaveText(APP_NAME);
    }
  });
});
