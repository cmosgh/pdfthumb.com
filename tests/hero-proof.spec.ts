import { expect, test } from "./fixtures";

// #140: the hero shows proof, not a stock picture. It has a real request and
// the thumbnails our production API returned for it, plus the hosting claim
// BE confirmed on #144.

test.describe("hero proof", () => {
  test("says where it's hosted, in the decided words", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByTestId("hero-subhead")).toHaveText(
      "Hosted in Germany · your files are never kept",
    );
  });

  test("shows the request that made the thumbnails", async ({ page }) => {
    await page.goto("/");
    const request = page.getByTestId("hero-request");
    await expect(request).toContainText(
      'curl -X POST "https://pdfthumb.com/api/thumbnail/page?page=1&width=400"',
    );
    await expect(request).toContainText('-F "file=@sample.pdf"');
    // The hero never shows a real key.
    await expect(request).toContainText("$PDFTHUMB_API_KEY");
  });

  test("shows the three thumbnails the API returned, at 400 px", async ({
    page,
  }) => {
    await page.goto("/");
    const thumbs = page.getByTestId("hero-thumbnails").getByRole("img");
    await expect(thumbs).toHaveCount(3);
    for (let n = 1; n <= 3; n++) {
      const thumb = thumbs.nth(n - 1);
      await expect(thumb).toHaveAttribute(
        "alt",
        new RegExp(`^Page ${n} of the sample PDF`),
      );
      await thumb.scrollIntoViewIfNeeded();
      // Loaded, and the file is the API's 400 px output, not a resize.
      await expect
        .poll(() => thumb.evaluate((img: HTMLImageElement) => img.naturalWidth))
        .toBe(400);
    }
  });

  test("has no stock picture left", async ({ page }) => {
    await page.goto("/");
    await expect(page.locator('img[src*="picsum"]')).toHaveCount(0);
  });
});
