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
      // In mobile, use the custom themed menu
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: /Loja|Store|Tienda/i }).click();
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

  test('should open product details from a canonical /sales/<slug> URL', async ({ page }) => {
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'sensor-dht22',
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

    await page.goto('/sales/sensor-dht22');

    await expect(page.getByRole('heading', { level: 2, name: 'SENSOR DHT22' })).toBeVisible();
    await expect(page).toHaveURL(/\/sales\/sensor-dht22$/);
  });

  test('should keep product modal fixed and scroll long descriptions', async ({ page }) => {
    const longDescription = Array.from(
      { length: 90 },
      (_, index) => `Long description segment ${index + 1}.`,
    ).join(' ');
    const wideImage = `data:image/svg+xml;utf8,${encodeURIComponent(
      '<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="300"><rect width="1200" height="300" fill="#d8d2c4"/><circle cx="600" cy="150" r="110" fill="#1d1d1d"/></svg>',
    )}`;

    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'long-desc-product',
              name: 'LONG DESC PRODUCT',
              description: longDescription,
              priceCents: 4590,
              currency: 'BRL',
              imageUrl: wideImage,
              variants: [{ id: 'v1', stock: 3 }],
            },
          ],
        }),
      });
    });

    await page.goto('/sales/long-desc-product');

    const dialog = page.getByRole('dialog', { name: 'LONG DESC PRODUCT' });
    await expect(dialog).toBeVisible();

    const metrics = await dialog.evaluate((modal) => {
      const description = modal.querySelector('p');
      const image = modal.querySelector('img');
      if (!description || !image) throw new Error('Modal content was not rendered');

      return {
        modalHeight: Math.round(modal.getBoundingClientRect().height),
        viewportHeight: window.innerHeight,
        descriptionScrolls: description.scrollHeight > description.clientHeight,
        imageFit: window.getComputedStyle(image).objectFit,
      };
    });

    expect(metrics.modalHeight).toBeLessThanOrEqual(Math.ceil(metrics.viewportHeight * 0.9));
    expect(metrics.descriptionScrolls).toBe(true);
    expect(metrics.imageFit).toBe('contain');
  });

  test('should redirect legacy ?product= query to canonical /sales/<slug>', async ({ page }) => {
    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          products: [
            {
              id: 'sensor-dht22',
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

    await page.goto('/sales?product=sensor-dht22');

    await expect(page).toHaveURL(/\/sales\/sensor-dht22$/);
    await expect(page.getByRole('heading', { level: 2, name: 'SENSOR DHT22' })).toBeVisible();
  });

  test('should scroll to home sections from the store menu', async ({ page, isMobile }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('arateki-lang', 'pt');
      window.localStorage.setItem('arateki-theme', 'dark');
    });

    await page.route('**/api/products*', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ products: [] }),
      });
    });

    await page.goto('/sales');

    if (isMobile) {
      await page.getByRole('button', { name: 'Menu' }).click();
    }

    await page.getByRole('link', { name: 'SafraSense' }).click();

    await expect(page).toHaveURL(/#safrasense$/);
    await expect.poll(async () => page.evaluate(() => {
      const target = document.getElementById('safrasense');
      const headerHeight = document.querySelector('nav')?.getBoundingClientRect().height ?? 0;
      if (!target) return Number.MAX_SAFE_INTEGER;
      return Math.abs(target.getBoundingClientRect().top - headerHeight);
    })).toBeLessThan(32);
  });

  test('should mark contact active at the footer', async ({ page, isMobile }) => {
    await page.addInitScript(() => {
      window.localStorage.setItem('arateki-lang', 'pt');
      window.localStorage.setItem('arateki-theme', 'dark');
    });

    await page.goto('/');

    if (isMobile) {
      await page.getByRole('button', { name: 'Menu' }).click();
      await page.getByRole('link', { name: 'Contato', exact: true }).click();
      await page.getByRole('button', { name: 'Menu' }).click();
      await expect(page.getByRole('link', { name: 'Contato', exact: true })).toHaveClass(/bg-\[/);
    } else {
      const contactLink = page.getByRole('link', { name: 'Contato', exact: true });
      await contactLink.click();
      await expect(contactLink).toHaveClass(/font-bold/);
    }
  });
});
