import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import type { Product } from '../domain/product.js';
import type { TestApp } from '../test/test-app.js';
import { createTestApp } from '../test/test-app.js';

describe('api routes', () => {
  let testApp: TestApp;

  beforeAll(async () => {
    testApp = await createTestApp();
  });

  afterAll(async () => {
    await testApp?.close();
  });

  it('does not expose unprefixed API routes', async () => {
    const productsResponse = await testApp.app.inject({
      method: 'GET',
      url: '/products',
    });
    const loginResponse = await testApp.app.inject({
      method: 'POST',
      url: '/login',
      payload: {
        login: 'admin',
        password: 'admin-password',
      },
    });

    expect(productsResponse.statusCode).toBe(404);
    expect(loginResponse.statusCode).toBe(404);
  });

  it('lists products publicly', async () => {
    const response = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/products'),
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      products: [
        { id: 'sensor-dht22', name: 'DHT22 SENSOR' },
        { id: 'esp32-wroom-32d', name: 'ESP32-WROOM-32D' },
      ],
    });
  });

  it('serves routes under the /api prefix used by the frontend', async () => {
    const healthResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/health'),
    });
    const productsResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/products?country=BR&lang=pt'),
    });

    expect(healthResponse.statusCode).toBe(200);
    expect(productsResponse.statusCode).toBe(200);
    expect(productsResponse.json()).toMatchObject({
      products: [
        { id: 'sensor-dht22', currency: 'BRL' },
        { id: 'esp32-wroom-32d', currency: 'BRL' },
      ],
    });
  });

  it('lists products in BRL for Brazil, USD otherwise, and selected language', async () => {
    const brResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/products?country=BR&lang=pt'),
    });
    const usResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/products?country=US'),
    });

    expect(brResponse.statusCode).toBe(200);
    expect(usResponse.statusCode).toBe(200);
    expect(brResponse.json()).toMatchObject({
      products: [
        {
          id: 'sensor-dht22',
          priceCents: 3290,
          currency: 'BRL',
          stock: 40,
          variants: [{ id: 'sensor-dht22-default', priceCents: 3290, currency: 'BRL' }],
        },
        {
          id: 'esp32-wroom-32d',
          description: 'Modulo Wi-Fi e Bluetooth para projetos IoT embarcados.',
          priceCents: 4590,
          currency: 'BRL',
          stock: 25,
          variants: [{ id: 'esp32-wroom-32d-default', priceCents: 4590, currency: 'BRL' }],
        },
      ],
    });
    expect(usResponse.json()).toMatchObject({
      products: [
        { id: 'sensor-dht22', priceCents: 649, currency: 'USD' },
        { id: 'esp32-wroom-32d', priceCents: 899, currency: 'USD' },
      ],
    });
  });

  it('serves a Google Merchant Center compatible RSS product feed', async () => {
    const response = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/feeds/google-shopping.xml?country=BR&lang=pt'),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/rss+xml');
    expect(response.body).toContain('<rss xmlns:g="http://base.google.com/ns/1.0" version="2.0">');
    expect(response.body).toContain('<g:id>sensor-dht22</g:id>');
    expect(response.body).toContain('<title>SENSOR DHT22</title>');
    expect(response.body).toContain('<g:price>32.90 BRL</g:price>');
    expect(response.body).toContain('<g:availability>in stock</g:availability>');
    expect(response.body).toContain('<g:brand>Arateki</g:brand>');
    expect(response.body).toContain('<g:mpn>SENSOR-DHT22</g:mpn>');
    expect(response.body).toContain('<link>https://arateki.test/pt/sales/sensor-dht22</link>');
  });

  it('serves a SEO sitemap with multi-language URLs and hreflang alternates', async () => {
    const response = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/sitemap.xml'),
    });

    expect(response.statusCode).toBe(200);
    expect(response.headers['content-type']).toContain('application/xml');
    expect(response.headers['cache-control']).toContain('max-age=3600');
    expect(response.body).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:xhtml="http://www.w3.org/1999/xhtml">');
    // All 5 languages × Home
    expect(response.body).toContain('<loc>https://arateki.test/pt</loc>');
    expect(response.body).toContain('<loc>https://arateki.test/en</loc>');
    expect(response.body).toContain('<loc>https://arateki.test/es</loc>');
    expect(response.body).toContain('<loc>https://arateki.test/zh</loc>');
    expect(response.body).toContain('<loc>https://arateki.test/ja</loc>');
    // Sales × languages
    expect(response.body).toContain('<loc>https://arateki.test/pt/sales</loc>');
    expect(response.body).toContain('<loc>https://arateki.test/en/sales</loc>');
    // Products × languages
    expect(response.body).toContain('<loc>https://arateki.test/pt/sales/sensor-dht22</loc>');
    expect(response.body).toContain('<loc>https://arateki.test/en/sales/sensor-dht22</loc>');
    expect(response.body).toContain('<loc>https://arateki.test/ja/sales/esp32-wroom-32d</loc>');
    // Hreflang alternates
    expect(response.body).toContain('<xhtml:link rel="alternate" hreflang="pt-BR" href="https://arateki.test/pt"');
    expect(response.body).toContain('<xhtml:link rel="alternate" hreflang="en" href="https://arateki.test/en/sales/sensor-dht22"');
    expect(response.body).toContain('<xhtml:link rel="alternate" hreflang="x-default" href="https://arateki.test/sales/sensor-dht22"');
    expect(response.body).toContain('<priority>1.0</priority>');
    expect(response.body).toMatch(/<lastmod>\d{4}-\d{2}-\d{2}T/);
  });

  it('serves spreadsheet feeds for Meta, Google and Microsoft catalog imports', async () => {
    const tsvResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/feeds/products.tsv?country=US&lang=en'),
    });
    const csvResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/feeds/meta-catalog.csv?country=US&lang=en'),
    });

    expect(tsvResponse.statusCode).toBe(200);
    expect(tsvResponse.headers['content-type']).toContain('text/tab-separated-values');
    expect(tsvResponse.body.split('\n')[0]).toBe('id\ttitle\tdescription\tavailability\tcondition\tprice\tlink\timage_link\tbrand\tmpn\tgoogle_product_category\tproduct_type');
    expect(tsvResponse.body).toContain('sensor-dht22\tDHT22 SENSOR\tDigital temperature and humidity sensor for prototyping benches');

    expect(csvResponse.statusCode).toBe(200);
    expect(csvResponse.headers['content-type']).toContain('text/csv');
    expect(csvResponse.body.split('\n')[0]).toBe('id,title,description,availability,condition,price,link,image_link,brand,mpn,google_product_category,product_type');
    expect(csvResponse.body).toContain('"sensor-dht22","DHT22 SENSOR","Digital temperature and humidity sensor for prototyping benches');
  });

  it('returns an admin token on login', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/login'),
      payload: {
        login: 'admin',
        password: 'admin-password',
      },
    });

    expect(response.statusCode).toBe(200);
    const body = response.json<{ token: string }>();
    const decoded = testApp.app.jwt.decode<{ exp: number; role: string }>(body.token);

    expect(body).toMatchObject({
      token: expect.any(String) as string,
    });
    expect(decoded?.role).toBe('admin');
    expect(decoded?.exp).toEqual(expect.any(Number));
  });

  it('rejects invalid login credentials', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/login'),
      payload: {
        login: 'admin',
        password: 'wrong-password',
      },
    });

    expect(response.statusCode).toBe(401);
  });

  it('rejects product creation without admin jwt', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/products'),
      payload: newProductPayload(),
    });

    expect(response.statusCode).toBe(401);
  });

  it('creates a pending order publicly', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/orders'),
      payload: newOrderPayload(),
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      order: {
        status: 'pending',
        currency: 'BRL',
        totalCents: 9180,
        contact: {
          email: 'maria@example.com',
        },
        address: {
          country: 'BR',
        },
        items: [
          {
            productId: 'esp32-wroom-32d',
            variantId: 'esp32-wroom-32d-default',
            sku: 'ESP32-WROOM-32D',
            quantity: 2,
            unitPriceCents: 4590,
            subtotalCents: 9180,
          },
        ],
      },
    });
  });

  it('rejects order creation with invalid items', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/orders'),
      payload: {
        ...newOrderPayload(),
        items: [{ productId: 'esp32-wroom-32d', variantId: 'missing', quantity: 1 }],
      },
    });

    expect(response.statusCode).toBe(400);
    expect(response.json()).toMatchObject({
      message: 'VARIANT_NOT_FOUND',
    });
  });

  it('creates product with admin jwt', async () => {
    const token = signAdminToken();

    const response = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/products'),
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: newProductPayload(),
    });

    expect(response.statusCode).toBe(201);
    expect(response.json()).toMatchObject({
      product: {
        name: localizedName(),
        description: localizedDescription(),
        variants: [
          {
            id: expect.any(String) as string,
            sku: 'PH-PROBE-STANDARD',
            attributes: {
              kind: 'standard',
            },
            prices: {
              brlCents: 12990,
              usdCents: 2499,
            },
            stock: 12,
            active: true,
          },
        ],
        active: true,
      },
    });
  });

  it('revokes the current token on logout', async () => {
    const token = signAdminToken();

    const logoutResponse = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/logout'),
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(logoutResponse.statusCode).toBe(204);

    const response = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/products'),
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: newProductPayload(),
    });

    expect(response.statusCode).toBe(401);
  });

  it('returns current admin and refreshes the bearer token', async () => {
    const token = signAdminToken();

    const meResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/me'),
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(meResponse.statusCode).toBe(200);
    expect(meResponse.json()).toMatchObject({
      user: {
        id: testApp.adminUserId,
        role: 'admin',
      },
    });

    const refreshResponse = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/refresh'),
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(refreshResponse.statusCode).toBe(200);
    const { token: refreshedToken } = refreshResponse.json<{ token: string }>();
    expect(refreshedToken).toEqual(expect.any(String));

    const oldTokenResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/me'),
      headers: {
        authorization: `Bearer ${token}`,
      },
    });
    expect(oldTokenResponse.statusCode).toBe(401);

    const refreshedTokenResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/me'),
      headers: {
        authorization: `Bearer ${refreshedToken}`,
      },
    });
    expect(refreshedTokenResponse.statusCode).toBe(200);
  });

  it('changes current user password and invalidates the previous token', async () => {
    const token = signAdminToken();

    const changePasswordResponse = await testApp.app.inject({
      method: 'PATCH',
      url: apiUrl('/users/password'),
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: {
        currentPassword: 'admin-password',
        newPassword: 'new-admin-password',
      },
    });

    expect(changePasswordResponse.statusCode).toBe(204);

    const oldTokenResponse = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/products'),
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: newProductPayload(),
    });

    expect(oldTokenResponse.statusCode).toBe(401);

    const loginResponse = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/login'),
      payload: {
        login: 'admin',
        password: 'new-admin-password',
      },
    });

    expect(loginResponse.statusCode).toBe(200);

    const auditLog = await testApp.mongo.db.collection('audit_logs').findOne({
      action: 'user.password.change',
      entityId: testApp.adminUserId,
    });
    expect(auditLog).toMatchObject({
      userId: testApp.adminUserId,
      action: 'user.password.change',
      entityType: 'user',
      entityId: testApp.adminUserId,
    });
  });

  it('rejects non-admin jwt', async () => {
    const token = testApp.app.jwt.sign({ role: 'user' });

    const response = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/products'),
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: newProductPayload(),
    });

    expect(response.statusCode).toBe(401);
  });

  it('allows admin to manage orders', async () => {
    const login = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/login'),
      payload: { login: 'admin', password: 'new-admin-password' },
    });
    const { token } = login.json<{ token: string }>();

    const createResponse = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/orders'),
      payload: newOrderPayload(),
    });
    const { order } = createResponse.json<{ order: { id: string } }>();

    const listResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/orders'),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listResponse.statusCode).toBe(200);
    expect(listResponse.json()).toMatchObject({
      orders: expect.arrayContaining([
        expect.objectContaining({ id: order.id, status: 'pending' })
      ]),
    });

    const getResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl(`/orders/${order.id}`),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getResponse.statusCode).toBe(200);
    expect(getResponse.json()).toMatchObject({
      order: expect.objectContaining({ id: order.id, status: 'pending' }),
    });

    const patchResponse = await testApp.app.inject({
      method: 'PATCH',
      url: apiUrl(`/orders/${order.id}/status`),
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'paid' },
    });
    expect(patchResponse.statusCode).toBe(204);

    const verifyResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl(`/orders/${order.id}`),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(verifyResponse.json()).toMatchObject({
      order: expect.objectContaining({ status: 'paid' }),
    });

    const auditLog = await testApp.mongo.db.collection('audit_logs').findOne({
      action: 'order.status.update',
      entityId: order.id,
    });
    expect(auditLog).toMatchObject({
      userId: testApp.adminUserId,
      action: 'order.status.update',
      entityType: 'order',
      entityId: order.id,
      before: expect.objectContaining({ status: 'pending' }),
      after: expect.objectContaining({ status: 'paid' }),
    });
  });

  it('allows admin to manage products', async () => {
    const login = await testApp.app.inject({
      method: 'POST',
      url: apiUrl('/login'),
      payload: { login: 'admin', password: 'new-admin-password' },
    });
    const { token } = login.json<{ token: string }>();

    // List admin products (should see everything)
    const listResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/admin/products'),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(listResponse.statusCode).toBe(200);
    const { products } = listResponse.json<{ products: Product[] }>();
    expect(products.length).toBeGreaterThan(0);

    const targetProduct = products[0];
    if (!targetProduct) throw new Error('Expected seeded product');

    const getProductResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl(`/admin/products/${targetProduct.id}`),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(getProductResponse.statusCode).toBe(200);
    expect(getProductResponse.json()).toMatchObject({
      product: expect.objectContaining({ id: targetProduct.id }),
    });

    const missingProductResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/admin/products/non-existent-id'),
      headers: { authorization: `Bearer ${token}` },
    });
    expect(missingProductResponse.statusCode).toBe(404);

    const unauthenticatedGetProductResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl(`/admin/products/${targetProduct.id}`),
    });
    expect(unauthenticatedGetProductResponse.statusCode).toBe(401);

    const updatePayload = {
      name: { ...targetProduct.name, pt: 'NOME ATUALIZADO' },
      description: targetProduct.description,
      variants: targetProduct.variants.map((v) => ({
        id: v.id,
        sku: v.sku,
        attributes: v.attributes,
        prices: { ...v.prices, usdCents: 9999 },
        stock: v.stock,
        active: v.active,
      })),
    };

    // Update product
    const updateResponse = await testApp.app.inject({
      method: 'PUT',
      url: apiUrl(`/products/${targetProduct.id}`),
      headers: { authorization: `Bearer ${token}` },
      payload: updatePayload,
    });
    expect(updateResponse.statusCode).toBe(200);
    expect(updateResponse.json().product.name.pt).toBe('NOME ATUALIZADO');

    const auditLog = await testApp.mongo.db.collection('audit_logs').findOne({
      action: 'product.update',
      entityId: targetProduct.id,
    });
    expect(auditLog).toMatchObject({
      userId: testApp.adminUserId,
      action: 'product.update',
      entityType: 'product',
      entityId: targetProduct.id,
      before: expect.objectContaining({ id: targetProduct.id }),
      after: expect.objectContaining({ id: targetProduct.id }),
    });

    // Verify public view changed (default is USD if no country provided)
    const publicResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/products?lang=pt'),
    });
    const updatedPublic = publicResponse.json<{ products: Array<{ id: string; name: string; priceCents: number }> }>().products.find(p => p.id === targetProduct.id);
    if (!updatedPublic) throw new Error('Expected updated public product');
    expect(updatedPublic.name).toBe('NOME ATUALIZADO');
    expect(updatedPublic.priceCents).toBe(9999);
  });

  it('returns 404 when updating non-existent product or order', async () => {
    // After password change, tokenVersion increments to 1
    const token = signAdminToken(1);

    const productResponse = await testApp.app.inject({
      method: 'PUT',
      url: apiUrl('/products/non-existent-id'),
      headers: { authorization: `Bearer ${token}` },
      payload: newProductPayload(),
    });
    expect(productResponse.statusCode).toBe(404);

    const orderResponse = await testApp.app.inject({
      method: 'PATCH',
      url: apiUrl('/orders/non-existent-id/status'),
      headers: { authorization: `Bearer ${token}` },
      payload: { status: 'paid' },
    });
    expect(orderResponse.statusCode).toBe(404);
  });

  it('rejects order management without admin jwt', async () => {
    const listResponse = await testApp.app.inject({
      method: 'GET',
      url: apiUrl('/orders'),
    });
    expect(listResponse.statusCode).toBe(401);
  });

  function signAdminToken(tokenVersion = 0): string {
    return testApp.app.jwt.sign({
      jti: randomUUID(),
      role: 'admin',
      sub: testApp.adminUserId,
      tokenVersion,
    });
  }
});

function apiUrl(path: string): string {
  return `/api${path}`;
}

function newProductPayload() {
  return {
    name: localizedName(),
    description: localizedDescription(),
    variants: [
      {
        sku: 'PH-PROBE-STANDARD',
        attributes: {
          kind: 'standard',
        },
        prices: {
          brlCents: 12990,
          usdCents: 2499,
        },
        stock: 12,
      },
    ],
  };
}

function newOrderPayload() {
  return {
    lang: 'pt',
    contact: {
      name: 'Maria Silva',
      email: 'maria@example.com',
      phone: '+5511999999999',
    },
    address: {
      country: 'br',
      postalCode: '01001-000',
      state: 'SP',
      city: 'Sao Paulo',
      line1: 'Rua Exemplo, 123',
    },
    items: [
      {
        productId: 'esp32-wroom-32d',
        variantId: 'esp32-wroom-32d-default',
        quantity: 2,
      },
    ],
  };
}

function localizedName() {
  return {
    pt: 'Sonda de pH',
    en: 'pH Sensor Probe',
    es: 'Sonda de pH',
    zh: 'pH 传感器探头',
    ja: 'pHセンサープローブ',
  };
}

function localizedDescription() {
  return {
    pt: 'Sonda para monitoramento de pH em hidroponia.',
    en: 'Probe for hydroponic pH monitoring.',
    es: 'Sonda para monitoreo de pH en hidroponia.',
    zh: '用于水培 pH 监测的探头。',
    ja: '水耕栽培のpH監視用プローブ。',
  };
}
