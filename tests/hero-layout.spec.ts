import { expect, test } from "@playwright/test";

// The hero's text must stay inside the viewport on a phone (#134): at 390 px
// the headline ran off the right edge ("Effortles"). #140 added the request
// and thumbnails, so it's checked up to desktop, in light and dark.
const WIDTHS = [320, 375, 390, 414, 768, 1024, 1280, 1440];

for (const width of WIDTHS) {
  for (const colorScheme of ["light", "dark"] as const) {
    test(`hero fits the viewport at ${width}px, ${colorScheme} (#134, #140)`, async ({
      page,
    }) => {
      await page.emulateMedia({ colorScheme });
      await page.setViewportSize({ width, height: 800 });
      await page.goto("/");
      const hero = page.locator("section").filter({ has: page.locator("h1") });
      await expect(hero.locator("h1")).toBeVisible();
      // Measure with the web font in place: the fallback font is wider.
      await page.evaluate(() => document.fonts.ready);
      // The boxes of every line of text in the hero, headline to buttons.
      const lines = await hero.evaluate((section) => {
        const boxes: { text: string; left: number; right: number }[] = [];
        const walker = document.createTreeWalker(section, NodeFilter.SHOW_TEXT);
        for (let node = walker.nextNode(); node; node = walker.nextNode()) {
          if (!node.textContent?.trim()) continue;
          const range = document.createRange();
          range.selectNodeContents(node);
          for (const rect of range.getClientRects()) {
            boxes.push({
              text: node.textContent.trim(),
              left: rect.left,
              right: rect.right,
            });
          }
        }
        return boxes;
      });
      expect(lines.length).toBeGreaterThan(0);
      for (const line of lines) {
        const where = `"${line.text}" at ${width}px`;
        expect(line.left, where).toBeGreaterThanOrEqual(0);
        expect(line.right, where).toBeLessThanOrEqual(width);
      }
      // And nothing in the hero makes it scroll sideways.
      const overflow = await hero.evaluate(
        (section) => section.scrollWidth - section.clientWidth,
      );
      expect(overflow).toBeLessThanOrEqual(0);
      // Pictures stay inside too.
      for (const box of await hero
        .locator("img")
        .evaluateAll((imgs) =>
          imgs.map((img) => img.getBoundingClientRect()),
        )) {
        expect(box.left).toBeGreaterThanOrEqual(0);
        expect(box.right).toBeLessThanOrEqual(width);
      }
    });
  }
}
