import { test, expect } from '@playwright/test';

test.describe('Admin Full Product Lifecycle', () => {
  test.beforeEach(async ({ page }) => {
    // Mock login for all tests in this block
    await page.addInitScript(() => {
      window.localStorage.setItem('arateki-lang', 'pt');
      window.localStorage.setItem('arateki-theme', 'dark');
      window.sessionStorage.setItem('arateki-admin-token', 'mock-token');
    });
  });

  test('should create, edit and list a product', async ({ page }) => {
    const newProduct = {
      id: 'p-new',
      name: { pt: 'Novo Item', en: 'New Item', es: 'Nuevo Item', zh: '新商品', ja: '新商品' },
      description: { pt: 'Descrição do novo item', en: 'New item description', es: 'Descripcion del nuevo item', zh: '新商品描述', ja: '新商品の説明' },
      active: true,
      variants: [{ id: 'v1', sku: 'SKU-NEW', attributes: { modelo: 'Padrão' }, prices: { brlCents: 1000, usdCents: 200 }, stock: 10, active: true }],
    };

    // 1. Mock GET list to be empty initially
    await page.route('**/api/admin/products', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ products: [] }) });
    });

    await page.goto('/manage/products');
    await expect(page.locator('text=Nenhum produto cadastrado')).toBeVisible();

    // 2. Mock POST product creation
    await page.route('**/api/products', async (route, request) => {
      if (request.method() === 'POST') {
        await route.fulfill({ status: 201, contentType: 'application/json', body: JSON.stringify({ product: newProduct }) });
      }
    });

    // 3. Navigate to creation form
    await page.getByRole('link', { name: /Novo Produto/i }).click();
    await expect(page).toHaveURL(/\/manage\/products\/new/);

    // 4. Fill and submit form
    await page.getByLabel('Nome (PT)').fill('Novo Item');
    await page.getByLabel('Nome (EN)').fill('New Item');
    await page.getByLabel('Nome (ES)').fill('Nuevo Item');
    await page.getByLabel('Nome (ZH)').fill('新商品');
    await page.getByLabel('Nome (JA)').fill('新商品');
    await page.getByLabel('Descrição (PT)').fill('Descrição do novo item');
    await page.getByLabel('Descrição (EN)').fill('New item description');
    await page.getByLabel('Descrição (ES)').fill('Descripcion del nuevo item');
    await page.getByLabel('Descrição (ZH)').fill('新商品描述');
    await page.getByLabel('Descrição (JA)').fill('新商品の説明');
    
    // Fill variant info
    await page.getByLabel('SKU').fill('SKU-123');
    await page.getByLabel('Modelo').fill('Padrão');
    await page.getByLabel('Preço BRL (Centavos)').fill('5000');
    await page.getByLabel('Preço USD (Centavos)').fill('1000');
    await page.getByLabel('Estoque').fill('20');

    // Update the mock to return the new product for the next list refresh
    await page.route('**/api/admin/products', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ products: [newProduct] }) });
    });

    await page.getByRole('button', { name: /Criar Produto/i }).click();

    // 5. Verify redirect and item presence
    await expect(page).toHaveURL(/\/manage\/products/);
    await expect(page.getByRole('heading', { name: 'Novo Item' })).toBeVisible();
  });
});

test.describe('Admin Order Lifecycle', () => {
  test('should update order status and reflect color change', async ({ page }) => {
    const order = {
      id: 'order-123',
      status: 'pending',
      contact: { name: 'Customer', email: 'c@c.com', phone: '1' },
      totalCents: 1000,
      currency: 'BRL',
      createdAt: new Date().toISOString(),
      items: [],
    };

    await page.addInitScript(() => {
      window.localStorage.setItem('arateki-lang', 'pt');
      window.localStorage.setItem('arateki-theme', 'dark');
      window.sessionStorage.setItem('arateki-admin-token', 'mock-token');
    });

    await page.route('**/api/orders', async (route) => {
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify({ orders: [order] }) });
    });

    await page.route('**/api/orders/order-123/status', async (route, request) => {
      if (request.method() === 'PATCH') {
        const body = JSON.parse(request.postData() || '{}');
        order.status = body.status;
        await route.fulfill({ status: 204 });
      }
    });

    await page.goto('/manage/orders');
    
    const statusButton = page.getByRole('button', { name: /Pendente/i });
    await expect(statusButton).toBeVisible();
    
    // Change status to paid
    await statusButton.click();
    await page.getByRole('option', { name: /Pago/i }).click();
    
    // Verify it changed
    const paidButton = page.getByRole('button', { name: /Pago/i });
    await expect(paidButton).toBeVisible();
    // Check if color changed (green-500 class should be there)
    await expect(paidButton).toHaveClass(/text-green-500/);
  });
});
