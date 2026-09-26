import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";

// Specs import `test` and `expect` from here, not from @playwright/test, so
// every test runs behind the unmocked-API guard below (#148). Everything else
// in @playwright/test passes through unchanged.
export * from "@playwright/test";
export { expect };

// Path globs (`*` within a segment, `**` across segments) of /api calls a
// test lets through the guard, per browser context.
const allowed = new WeakMap<BrowserContext, RegExp[]>();

function globToRegExp(glob: string): RegExp {
  const source = glob
    .split("**")
    .map((part) =>
      part
        .split("*")
        .map((s) => s.replace(/[.+?^${}()|[\]\\]/g, "\\$&"))
        .join("[^/]*"),
    )
    .join(".*");
  return new RegExp(`^${source}$`);
}

/**
 * Lets a test make /api calls matching `paths` (globs over the path, without
 * the query: `/api/health/*`) without mocking them. They're still aborted, so
 * nothing reaches a backend, but they don't fail the test. Use it only for
 * calls the test doesn't care about, with a comment saying why.
 */
export function allowUnmocked(
  target: Page | BrowserContext,
  paths: string[],
): void {
  const context = "context" in target ? target.context() : target;
  allowed.set(context, [
    ...(allowed.get(context) ?? []),
    ...paths.map(globToRegExp),
  ]);
}

export const test = base.extend({
  // A catch-all for /api, on the context so it also covers pages a test
  // opens in new tabs. It's registered before the test runs, and Playwright
  // tries the newest route first and page routes before context routes, so
  // any mock a test sets up wins over it. An /api call that reaches it had no
  // mock: it's aborted (never proxied to a backend that isn't there, nor to
  // production's API on a live run), and the test fails naming it.
  context: async ({ context }, use) => {
    const unmocked = new Set<string>();
    await context.route(
      (url) => url.pathname.startsWith("/api/"),
      (route) => {
        const request = route.request();
        const url = new URL(request.url());
        const patterns = allowed.get(context) ?? [];
        if (!patterns.some((p) => p.test(url.pathname))) {
          unmocked.add(`${request.method()} ${url.pathname}${url.search}`);
        }
        return route.abort();
      },
    );
    await use(context);
    if (unmocked.size > 0) {
      throw new Error(
        `Unmocked API calls (mock them with page.route, or allowUnmocked() ` +
          `them with a reason):\n${[...unmocked].map((c) => `  ${c}`).join("\n")}`,
      );
    }
  },
});
