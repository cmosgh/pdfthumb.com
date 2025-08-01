import { test, expect } from '@playwright/test';

// Adjust the URL if your dev server runs on a different port
const BASE_URL = 'http://localhost:4173';

test.describe('index.tsx basic render', () => {
  test('should load the app and display the root element', async ({ page }) => {
    await page.goto(BASE_URL);
    const root = await page.$('#root');
    expect(root).not.toBeNull();
  });

  test('should render the Hero section', async ({ page }) => {
    await page.goto(BASE_URL);
    // Assuming the Hero section contains a heading with a unique text, e.g., "PDF Thumbnail Pro"
    await expect(page.getByRole('heading', { name: /Instant PDF Thumbnails/i })).toBeVisible();
  });

  test('should render the Navbar and Footer', async ({ page }) => {
    await page.goto(BASE_URL);
    // Check for Navbar (assume it has a nav role)
    await expect(page.getByRole('navigation')).toBeVisible();
    // Check for Footer (assume it has a contentinfo role)
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });

  test('should render the Pricing section with correct tiers and prices', async ({ page }) => {
    await page.goto(BASE_URL);
    // These tiers and prices are sourced from constants.ts
    const tiers = [
      { name: /Developer/i, price: /^0$/i },
      { name: /Basic/i, price: /^9$/i },
      { name: /Pro/i, price: /^49$/i },
      { name: /Enterprise/i, price: /Custom/i },
    ];
    for (const tier of tiers) {
      // Check for the tier name
      await expect(page.getByRole('heading', { name: tier.name })).toBeVisible();
      // Check for the price value (not including frequency or currency symbol)
      await expect(page.getByText(tier.price)).toBeVisible();
    }
  });

  test('should show annual prices for tiers when toggled', async ({ page }) => {
    await page.goto(BASE_URL);
    // Simulate clicking the annual/monthly toggle (assume it has a role or label)
    // Try common selectors, adjust as needed for your UI
    const toggle = await page.getByRole('button', { name: /annual/i });
    await toggle.click();
    // These annual prices are sourced from constants.ts
    const annualTiers = [
      { name: /Basic/i, price: /^100$/i },
      { name: /Pro/i, price: /^490$/i },
    ];
    for (const tier of annualTiers) {
      await expect(page.getByRole('heading', { name: tier.name })).toBeVisible();
      await expect(page.getByText(tier.price)).toBeVisible();
    }
    // Developer and Enterprise do not have annual prices, so we do not check them here
  });
});
