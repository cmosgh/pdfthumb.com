import { test, expect } from '@playwright/test';

// Adjust the URL if your dev server runs on a different port
const BASE_URL = 'http://localhost:5173';

test.describe('index.tsx basic render', () => {
  test('should load the app and display the root element', async ({ page }) => {
    await page.goto(BASE_URL);
    const root = await page.$('#root');
    expect(root).not.toBeNull();
  });

  test('should render the Hero section', async ({ page }) => {
    await page.goto(BASE_URL);
    // Assuming the Hero section contains a heading with a unique text, e.g., "PDF Thumbnail Pro"
    await expect(page.getByRole('heading', { name: /pdf thumbnail pro/i })).toBeVisible();
  });

  test('should render the Navbar and Footer', async ({ page }) => {
    await page.goto(BASE_URL);
    // Check for Navbar (assume it has a nav role)
    await expect(page.getByRole('navigation')).toBeVisible();
    // Check for Footer (assume it has a contentinfo role)
    await expect(page.getByRole('contentinfo')).toBeVisible();
  });
});

