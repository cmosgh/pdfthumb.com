import { test, expect } from '@playwright/test';
import { APP_NAME } from '../src/constants';

test.describe('Branding Consistency', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('header and footer should display consistent brand name', async ({ page }) => {
    // Check header brand name
    const headerBrand = await page.locator('header').getByText(/PDFThumb/i).first();
    const headerText = await headerBrand.textContent();

    // Check footer brand name
    const footerBrand = await page.locator('footer').getByText(/PDFThumb/i).first();
    const footerText = await footerBrand.textContent();

    // Both should contain the same brand name
    expect(headerText?.trim()).toBe(footerText?.trim());
  });

  test(`header should display ${APP_NAME}`, async ({ page }) => {
    const headerBrand = await page.locator('header').getByText(APP_NAME);
    await expect(headerBrand).toBeVisible();
  });

  test(`footer should display ${APP_NAME}`, async ({ page }) => {
    const footerBrand = await page.locator('footer span').getByText(APP_NAME);
    await expect(footerBrand).toBeVisible();
  });

  test(`copyright notice should include ${APP_NAME}`, async ({ page }) => {
    const currentYear = new Date().getFullYear();
    const copyrightText = `© ${currentYear} ${APP_NAME}. All rights reserved.`;
    const footer = page.locator('footer');
    await expect(footer).toContainText(copyrightText);
  });

  test('brand consistency across all pages', async ({ page }) => {
    const pages = ['/', '/features', '/pricing'];

    for (const pagePath of pages) {
      await page.goto(pagePath);

      // Check header
      const headerBrand = await page.locator('header').getByText(APP_NAME);
      await expect(headerBrand).toBeVisible();

      // Check footer
      const footerBrand = await page.locator('footer span').getByText(APP_NAME);
      await expect(footerBrand).toBeVisible();
    }
  });
});