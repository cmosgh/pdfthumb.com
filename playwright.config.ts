import { defineConfig, devices } from "@playwright/test";

/**
 * Read environment variables from file.
 * https://github.com/motdotla/dotenv
 */
import dotenv from "dotenv";
import path, { dirname } from "path";
import { fileURLToPath } from "url";

dotenv.config({
  path: path.resolve(dirname(fileURLToPath(import.meta.url)), ".env"),
});

const DESKTOP_WIDTH = parseInt(process.env.DESKTOP_WIDTH || "1920", 10);
const DESKTOP_HEIGHT = parseInt(process.env.DESKTOP_HEIGHT || "1080", 10);
const MOBILE_WIDTH = parseInt(process.env.MOBILE_WIDTH || "375", 10);
const MOBILE_HEIGHT = parseInt(process.env.MOBILE_HEIGHT || "667", 10);

/**
 * See https://playwright.dev/docs/test-configuration.
 */
export default defineConfig({
  timeout: 7 * 1000,
  testDir: "./tests",
  /* Run tests in files in parallel */
  fullyParallel: !process.env.CI,
  /* Fail the build on CI if you accidentally left test.only in the source code. */
  forbidOnly: !!process.env.CI,
  /* Retry on CI only */
  retries: process.env.CI ? 2 : 0,
  /* Opt out of parallel tests on CI. */
  workers: process.env.CI ? 1 : undefined,
  /* Reporter to use. See https://playwright.dev/docs/test-reporters */
  reporter: process.env.CI ? "dot" : "list",

  /* Shared settings for all the projects below. See https://playwright.dev/docs/api/class-testoptions. */
  use: {
    /* Base URL to use in actions like `await page.goto('/')`. */
    baseURL: "http://localhost:4173",

    /* Collect trace when retrying the failed test. See https://playwright.dev/docs/trace-viewer */
    trace: "on-first-retry",

    screenshot: "only-on-failure",

    testIdAttribute: "data-testid",
    viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
  },

  /* Configure projects for major browsers */
  projects: [
    {
      name: "chromium",
      use: { 
        ...devices["Desktop Chrome"],
        viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
      },
    },

    {
      name: "firefox",
      use: { 
        ...devices["Desktop Firefox"],
        timeout: 10 * 1000,
        viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
      },
    },

    {
      name: "webkit",
      use: { 
        ...devices["Desktop Safari"],
        viewport: { width: DESKTOP_WIDTH, height: DESKTOP_HEIGHT },
      },
    },

    /* Test against mobile viewports. */
    {
      name: "Mobile Chrome",
      use: {
        ...devices["Pixel 5"],
        viewport: { width: MOBILE_WIDTH, height: MOBILE_HEIGHT },
        isMobile: true,
      },
      tags: ["@mobile"],
    },
    {
      name: "Mobile Safari",
      use: {
        ...devices["iPhone 12"],
        viewport: { width: MOBILE_WIDTH, height: MOBILE_HEIGHT },
      },
      tags: ["@mobile"],
    },

    /* Test against branded browsers. */
    // {
    //   name: 'Microsoft Edge',
    //   use: { ...devices['Desktop Edge'], channel: 'msedge' },
    // },
    // {
    //   name: 'Google Chrome',
    //   use: { ...devices['Desktop Chrome'], channel: 'chrome' },
    // },
  ],

  /* Run your local dev server before starting the tests */
  webServer: {
    command: "npm run build && npm run preview",
    url: "http://localhost:4173",
    reuseExistingServer: true,
  },
});
