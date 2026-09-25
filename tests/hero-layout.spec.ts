import { expect, test } from "@playwright/test";

// The hero's text must stay inside the viewport on a phone (#134): at 390 px
// the headline ran off the right edge ("Effortles").
const WIDTHS = [320, 375, 390, 414];

for (const width of WIDTHS) {
  test(`hero text fits the viewport at ${width}px (#134)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 800 });
    await page.goto("/");
    const hero = page.locator("section").filter({ has: page.locator("h1") });
    await expect(hero.locator("h1")).toBeVisible();
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
  });
}
