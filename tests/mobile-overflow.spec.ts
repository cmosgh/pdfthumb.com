import { test, expect, type Page } from "@playwright/test";
import { widestOverflow, describeOverflow } from "./overflow-helper";

// How far the page is wider than the viewport, in px
const overflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);

// #136: at 320 px the navbar's menu button ended 1 px past the viewport, so
// every page scrolled sideways. No public page may be wider than a phone.
const WIDTHS = [320, 375, 390, 414];
const ROUTES = [
  "/",
  "/pricing",
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
      // then again once the web font has loaded. On failure, name the
      // widest element past the edge rather than just the pixel count.
      const assertFits = async () => {
        const amount = await overflow(page);
        const widest = await widestOverflow(page.locator("html"), width);
        expect(amount, describeOverflow(widest)).toBeLessThanOrEqual(0);
      };
      await assertFits();
      await page.evaluate(() => document.fonts.ready);
      await assertFits();
    });
  }
}
