import { test, expect } from "@playwright/test";

// #136: at 320 px the navbar's menu button ended 1 px past the viewport, so
// every page scrolled sideways. No public page may be wider than a phone.
const WIDTHS = [320, 375, 390, 414];
const ROUTES = ["/", "/docs", "/login"];

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    test(`${route} fits a ${width} px viewport`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route);
      await expect(page.locator("header")).toBeVisible();
      await expect(
        page.locator("main").getByRole("heading").first(),
      ).toBeVisible();
      const { scrollWidth, innerWidth } = await page.evaluate(() => ({
        scrollWidth: document.documentElement.scrollWidth,
        innerWidth: window.innerWidth,
      }));
      expect(scrollWidth).toBeLessThanOrEqual(innerWidth);
    });
  }
}
