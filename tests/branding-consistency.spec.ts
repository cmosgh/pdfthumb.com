import { expect, test } from "@playwright/test";
import { APP_NAME } from "@/constants.ts";

test.describe("Branding Consistency", () => {
  test.describe("Header Branding", () => {
    test.beforeEach(async ({ page }) => {
      await page.goto("/");
      await new Promise((r) => setTimeout(r, 500)); // Wait for potential animations
      await page.evaluate(() => window.scrollTo(0, 0)); // Ensure we're at the top of the page
    });

    test("should display correct brand name on different view widths", async ({
      page,
    }) => {
      if (page.viewportSize()?.width && page.viewportSize()!.width < 768) {
        const mobileBrand = page.getByTestId("brand-name-mobile");
        await expect(mobileBrand).toBeVisible();
        await expect(mobileBrand).toContainText(APP_NAME.replace(".com", ""));
      } else {
        const desktopBrandWrapper = page.getByTestId("brand-name-wrapper");
        expect(desktopBrandWrapper).not.toBeNull();
        const desktopBrand = desktopBrandWrapper.getByTestId("brand-name-desktop");
        await expect(desktopBrand).toBeVisible();
        await expect(desktopBrand).toContainText(APP_NAME);
      }
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
        .getByText(APP_NAME, { exact: true });
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

  test("brand consistency across all pages", async ({ page }) => {
    const pages = ["/", "/features", "/pricing"];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Check header based on viewport width
      if (page.viewportSize()?.width && page.viewportSize()!.width < 768) {
        const headerBrand = page.getByTestId("brand-name-mobile");
        await expect(headerBrand).toBeVisible();
        await expect(headerBrand).toContainText(APP_NAME.replace(".com", ""));
      } else {
        const desktopBrandWrapper = page.getByTestId("brand-name-wrapper");
        expect(desktopBrandWrapper).not.toBeNull();
        const desktopBrand = desktopBrandWrapper.getByTestId("brand-name-desktop");
        await expect(desktopBrand).toBeVisible();
        await expect(desktopBrand).toContainText(APP_NAME);
      }

      // Check footer
      await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
      const footerBrand = page
        .locator("footer")
        .getByText(APP_NAME, { exact: true });
      await expect(footerBrand).toBeVisible();
      await expect(footerBrand).toHaveText(APP_NAME);
    }
  });
});
