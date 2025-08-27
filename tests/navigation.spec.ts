import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.describe('from index page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/');
    });

    test('should navigate to features section', async ({ page }) => {
      await page.click('text=Features');
      await expect(page).toHaveURL('/#features');
      await expect(page.locator('#features')).toBeVisible();
    });

    test('should navigate to pricing section', async ({ page }) => {
      await page.click('text=Pricing');
      await expect(page).toHaveURL('/#pricing');
      await expect(page.locator('#pricing')).toBeVisible();
    });

    test('should navigate to docs section', async ({ page }) => {
      await page.click('text=Docs');
      await expect(page).toHaveURL('/#features');
      await expect(page.locator('#features')).toBeVisible();
    });
  });

  test.describe('from login page', () => {
    test.beforeEach(async ({ page }) => {
      await page.goto('/login');
    });

    test('should navigate to features section', async ({ page }) => {
      await page.click('text=Features');
      await expect(page).toHaveURL('/#features');
      await expect(page.locator('#features')).toBeVisible();
    });

    test('should navigate to pricing section', async ({ page }) => {
      await page.click('text=Pricing');
      await expect(page).toHaveURL('/#pricing');
      await expect(page.locator('#pricing')).toBeVisible();
    });

    test('should navigate to docs section', async ({ page }) => {
      await page.click('text=Docs');
      await expect(page).toHaveURL('/#features');
      await expect(page.locator('#features')).toBeVisible();
    });
  });
});
