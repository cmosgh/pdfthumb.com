import { allowUnmocked, expect, test } from "./fixtures";

// Runs only in the image smoke (.github/workflows/image.yml), against the
// built nginx image with PLAYWRIGHT_BASE_URL on a container and SERVED_THEME
// the theme it serves. This checks what vite preview can't: nginx's SSI
// output. After #156, an SSI opener in the boot script truncated every page
// in production while every other check stayed green.
const theme = process.env.SERVED_THEME;

test.describe("The page nginx serves, with its runtime theme", () => {
  test.skip(!theme, "runs in the image smoke only (SERVED_THEME)");

  for (const path of ["/", "/docs", "/login", "/dashboard/settings"]) {
    test(`${path} arrives whole and renders with the theme`, async ({
      page,
      request,
    }) => {
      const html = await (await request.get(path)).text();
      expect(html.trimEnd()).toMatch(/<\/html>$/);
      expect(html).toMatch(/<script type="module"[^>]* src="\/assets\//);
      // nginx replaced the include; the theme itself may hold inert text.
      const outsideTheme = html.replace(
        /(id="pt-theme">)[\s\S]*?(<\/script>)/,
        "$1$2",
      );
      expect(outsideTheme).not.toContain("<!--#");

      // This checks the HTML nginx serves, not the app's data: whatever the
      // app asks /api for (e.g. /dashboard/settings' key list) stays
      // unanswered, still aborted by the fixture.
      allowUnmocked(page, ["/api/**"]);
      await page.goto(path);
      await expect(page.locator("footer")).toBeVisible();
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme!);
    });
  }
});
