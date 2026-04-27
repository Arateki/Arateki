import { test, expect } from '@playwright/test';

test.describe('Arateki Landing Page', () => {
  test('should load the homepage and show the main title', async ({ page }) => {
    await page.goto('/');
    
    const title = page.locator('h1');
    await expect(title).toBeVisible();
  });

  test('visual regression - homepage', async ({ page }) => {
    await page.goto('/');
    
    await page.evaluate(async () => {
      const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
      for (let i = 0; i < document.body.scrollHeight; i += 100) {
        window.scrollTo(0, i);
        await delay(10);
      }
      window.scrollTo(0, 0);
    });

    await page.waitForTimeout(2000);
    
    await page.addStyleTag({ content: 'canvas { visibility: hidden !important; }' });

    await expect(page).toHaveScreenshot({ 
      fullPage: true
    });
  });

  test('language switch should update content', async ({ page }) => {
    await page.goto('/');
    
    const langSelect = page.locator('select').last();
    await langSelect.selectOption('en');
    
    await expect(page.locator('h1')).toContainText('Reliable Solutions.');
  });
});
