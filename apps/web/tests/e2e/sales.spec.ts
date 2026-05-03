import { test, expect } from '@playwright/test';

test.describe('Sales Page', () => {
  test('should navigate to sales page and display products', async ({ page, isMobile }) => {
    // Mock Products API
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: '1',
              name: 'ESP32-WROOM-32D',
              description: 'Mock desc',
              priceCents: 4590,
              currency: 'BRL',
              imageUrl: '',
              variants: [{ id: 'v1' }],
            },
            {
              id: '2',
              name: 'SENSOR DHT22',
              description: 'Mock desc',
              priceCents: 3250,
              currency: 'BRL',
              imageUrl: '',
              variants: [{ id: 'v2' }],
            }
          ],
        }),
      });
    });

    await page.goto('/');
    
    if (isMobile) {
      // In mobile, use the select menu
      await page.locator('select').first().selectOption('/sales');
    } else {
      // In desktop, click on Store link
      const storeLink = page.getByRole('link', { name: /Loja|Store|Tienda/i });
      await storeLink.click();
    }
    
    // Verify URL
    await expect(page).toHaveURL(/\/sales/);
    
    // Verify Page Title (accepts PT or EN depending on browser locale)
    await expect(page.locator('h1')).toContainText(/Loja de produtos e componentes|Products & Components Store/i);
    
    // Wait for products to load (mock delay is 800ms)
    const productCards = page.locator('h3');
    await expect(productCards.first()).toBeVisible({ timeout: 5000 });
    
    // Verify some products exist
    const names = await productCards.allInnerTexts();
    expect(names).toContain('ESP32-WROOM-32D');
    expect(names).toContain('SENSOR DHT22');
  });
});
