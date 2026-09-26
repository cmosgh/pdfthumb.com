import { expect, test } from "@playwright/test";
// The price must fit its card and sit below the description at every width
// (#131). On /pricing (#141) the three self-serve cards share a row from lg
// (1024 px) and stack below it; Enterprise sits in the band under them.
const WIDTHS = [320, 375, 390, 768, 1024, 1152, 1280, 1440];
const SELF_SERVE = ["free", "basic", "pro"];

for (const width of WIDTHS) {
  test(`every price fits its card at ${width}px (#131)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/pricing");
    await page.getByTestId("pricing-self-serve").scrollIntoViewIfNeeded();
    // Measure with the web font in place: the fallback font is wider.
    await page.evaluate(() => document.fonts.ready);
    for (const id of SELF_SERVE) {
      const card = page.getByTestId(`pricing-card-${id}`);
      const box = await card.evaluate((el) => {
        const rect = (node: Element) => node.getBoundingClientRect();
        const price = el.querySelector('[data-testid="pricing-card-price"]')!;
        const amount = price.querySelector("span")!;
        const description = price.previousElementSibling!;
        return {
          card: rect(el),
          amount: rect(amount),
          price: rect(price),
          descriptionBottom: rect(description).bottom,
          descriptionContentBottom:
            rect(description).top + description.scrollHeight,
          lineHeight: parseFloat(getComputedStyle(amount).lineHeight),
          // The widest right edge of anything drawn inside the card.
          contentRight: Math.max(
            ...[...el.querySelectorAll("*")].map((n) => rect(n).right),
          ),
        };
      });
      const where = `${id} at ${width}px`;
      expect(box.amount.left, where).toBeGreaterThanOrEqual(box.card.left);
      expect(box.amount.right, where).toBeLessThanOrEqual(box.card.right);
      // One line: no "Upcomin / g".
      expect(box.amount.height, where).toBeLessThan(box.lineHeight * 1.5);
      // Nothing else in the card (addresses, features) crosses its edge.
      expect(box.contentRight, where).toBeLessThanOrEqual(box.card.right);
      // The description's text, even when it wraps, ends above the price.
      expect(box.descriptionContentBottom, where).toBeLessThanOrEqual(
        box.price.top + 0.5,
      );
    }
  });
}

// Three cards in one row from lg, one per row below it (#141).
for (const [width, perRow] of [
  [390, 1],
  [768, 1],
  [1024, 3],
  [1440, 3],
] as const) {
  test(`${perRow} self-serve card(s) per row at ${width}px (#141)`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/pricing");
    // Centres, not tops: the featured card is scaled up around its centre.
    const centres = await Promise.all(
      SELF_SERVE.map((id) =>
        page.getByTestId(`pricing-card-${id}`).evaluate((el) => {
          const box = el.getBoundingClientRect();
          return Math.round(box.top + box.height / 2);
        }),
      ),
    );
    expect(new Set(centres).size).toBe(perRow === 3 ? 1 : 3);
  });
}
