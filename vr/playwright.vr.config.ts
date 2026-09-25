import base from "../playwright.config";

// Visual regression for #137 (local only, not in CI): screenshots of every
// page in light and dark at 390 and 1280 px, compared pixel for pixel with
// baselines taken from main. Baselines are platform-specific, so they're not
// committed; see vr/README.md.
const port = process.env.VR_PORT ?? "4313";

export default {
  ...base,
  testDir: ".",
  snapshotPathTemplate:
    process.env.VR_SNAPSHOTS ?? "{testDir}/__snapshots__/{arg}{ext}",
  workers: 4,
  retries: 0,
  projects: [{ name: "chromium", use: { browserName: "chromium" } }],
  use: { ...base.use, baseURL: `http://localhost:${port}` },
  webServer: {
    command: `npm run build && npx vite preview --port ${port} --strictPort`,
    url: `http://localhost:${port}`,
    reuseExistingServer: false,
    // Playwright runs this from the config's folder; build from the root.
    cwd: "..",
  },
};
