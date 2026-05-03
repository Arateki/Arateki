import { test, expect } from '@playwright/test';

test.describe('Admin Dashboard', () => {
  test.beforeEach(async ({ page }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('arateki-lang', 'pt');
      window.localStorage.setItem('arateki-theme', 'dark');
    });
  });

  test('should redirect to login if not authenticated', async ({ page }) => {
    await page.goto('/manage');
    await expect(page).toHaveURL(/\/manage\/login/);
    await expect(page.locator('h1')).toContainText(/Arateki Manage/i);
  });

  test('should login successfully and view orders', async ({ page }) => {
    // Mock Login
    await page.route('**/api/login', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ token: 'mock-jwt-token' }),
      });
    });

    // Mock Orders
    await page.route('**/api/orders', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          orders: [
            {
              id: 'order-1',
              status: 'pending',
              contact: { name: 'John Doe', email: 'john@example.com', phone: '123' },
              totalCents: 15000,
              currency: 'BRL',
              createdAt: new Date().toISOString(),
              items: [],
            }
          ],
        }),
      });
    });

    await page.goto('/manage/login');
    
    // Fill login form
    await page.locator('input[type="text"]').fill('admin');
    await page.locator('input[type="password"]').fill('password');
    await page.getByRole('button', { name: /Entrar/i }).click();

    // Should redirect to manage (which redirects to orders)
    await expect(page).toHaveURL(/\/manage\/orders/);
    
    // Verify order is visible
    await expect(page.locator('text=John Doe')).toBeVisible();
    await expect(page.locator('text=R$ 150,00')).toBeVisible();
  });

  test('should be able to navigate to products', async ({ page, isMobile }) => {
    // Mock and skip login
    await page.addInitScript(() => {
      window.sessionStorage.setItem('arateki-admin-token', 'mock-token');
    });

    // Mock admin products
    await page.route('**/api/admin/products', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'p1',
              name: { pt: 'Produto Teste', en: 'Test Product', es: 'Producto de Prueba', zh: '测试产品', ja: 'テスト製品' },
              description: { pt: 'Desc', en: 'Desc', es: 'Desc', zh: '描述', ja: '説明' },
              active: true,
              variants: [{ sku: 'SKU-1' }],
            }
          ],
        }),
      });
    });

    await page.goto('/manage/orders');

    if (isMobile) {
      // In mobile, we don't have a sidebar link easily reachable without opening menu
      // For now just navigate directly
      await page.goto('/manage/products');
    } else {
      await page.getByRole('link', { name: /Produtos/i }).click();
    }

    await expect(page).toHaveURL(/\/manage\/products/);
    await expect(page.locator('text=Produto Teste')).toBeVisible();
    await expect(page.locator('text=SKU-1')).toBeVisible();
  });
});
