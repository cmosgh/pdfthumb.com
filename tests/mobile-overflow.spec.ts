import { test, expect, type Page } from "@playwright/test";

// How far the page is wider than the viewport, in px
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// #136: at 320 px the navbar's menu button ended 1 px past the viewport, so
// every page scrolled sideways. No public page may be wider than a phone.
const WIDTHS = [320, 375, 390, 414];
const ROUTES = [
  "/",
  "/docs",
  "/login",
  "/status",
  "/security",
  "/subprocessors",
  "/terms",
  "/privacy",
];

for (const width of WIDTHS) {
  for (const route of ROUTES) {
    test(`${route} fits a ${width} px viewport (#136)`, async ({ page }) => {
      await page.setViewportSize({ width, height: 800 });
      await page.goto(route);
      await expect(page.locator("header")).toBeVisible();
      await expect(
        page.locator("main").getByRole("heading").first(),
      ).toBeVisible();
      // Checked in whichever font shows first (often the wider fallback),
      // then again once the web font has loaded.
      expect(await overflow(page)).toBeLessThanOrEqual(0);
      await page.evaluate(() => document.fonts.ready);
      expect(await overflow(page)).toBeLessThanOrEqual(0);
    });
  }
}
