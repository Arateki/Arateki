import { test, expect } from '@playwright/test';

test.describe('Sales Page', () => {
  test('should navigate to sales page and display products', async ({ page, isMobile }) => {
    await page.goto('/');
    
    if (isMobile) {
      // In mobile, use the select menu
      await page.locator('select').first().selectOption('/vendas');
    } else {
      // In desktop, click on Store link
      const storeLink = page.getByRole('link', { name: /Loja|Store|Tienda/i });
      await storeLink.click();
    }
    
    // Verify URL
    await expect(page).toHaveURL(/\/vendas/);
    
    // Verify Page Title
    await expect(page.locator('h1')).toContainText(/Loja de Componentes/i);
    
    // Wait for products to load (mock delay is 800ms)
    const productCards = page.locator('h3');
    await expect(productCards.first()).toBeVisible({ timeout: 5000 });
    
    // Verify some products exist
    const names = await productCards.allInnerTexts();
    expect(names).toContain('ESP32-WROOM-32D');
    expect(names).toContain('SENSOR DHT22');
  });
});
