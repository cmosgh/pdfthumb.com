import { expect, test } from "@playwright/test";
import { PRICING_TIERS } from "@/constants.ts";

// The price must fit its card and sit below the description at every width
// (#131): four cards in a row from lg (1024 px), two at md, one on a phone.
const WIDTHS = [375, 768, 1024, 1152, 1280, 1440];

for (const width of WIDTHS) {
  test(`every price fits its card at ${width}px (#131)`, async ({ page }) => {
    await page.setViewportSize({ width, height: 900 });
    await page.goto("/");
    await page.getByTestId("pricing-section").scrollIntoViewIfNeeded();
    // Measure with the web font in place: the fallback font is wider.
    await page.evaluate(() => document.fonts.ready);
    for (const tier of PRICING_TIERS) {
      const card = page.getByTestId(`pricing-card-${tier.id}`);
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
      const where = `${tier.id} at ${width}px`;
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
