import { randomUUID } from 'node:crypto';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
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

  it('lists products publicly', async () => {
    const response = await testApp.app.inject({
      method: 'GET',
      url: '/products',
    });

    expect(response.statusCode).toBe(200);
    expect(response.json()).toMatchObject({
      products: [
        { id: 'sensor-dht22', name: 'DHT22 SENSOR' },
        { id: 'esp32-wroom-32d', name: 'ESP32-WROOM-32D' },
      ],
    });
  });

  it('lists products in BRL for Brazil, USD otherwise, and selected language', async () => {
    const brResponse = await testApp.app.inject({
      method: 'GET',
      url: '/products?country=BR&lang=pt',
    });
    const usResponse = await testApp.app.inject({
      method: 'GET',
      url: '/products?country=US',
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

  it('returns an admin token on login', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/login',
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
      url: '/login',
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
      url: '/products',
      payload: newProductPayload(),
    });

    expect(response.statusCode).toBe(401);
  });

  it('creates a pending order publicly', async () => {
    const response = await testApp.app.inject({
      method: 'POST',
      url: '/orders',
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
      url: '/orders',
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
      url: '/products',
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
      url: '/logout',
      headers: {
        authorization: `Bearer ${token}`,
      },
    });

    expect(logoutResponse.statusCode).toBe(204);

    const response = await testApp.app.inject({
      method: 'POST',
      url: '/products',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: newProductPayload(),
    });

    expect(response.statusCode).toBe(401);
  });

  it('changes current user password and invalidates the previous token', async () => {
    const token = signAdminToken();

    const changePasswordResponse = await testApp.app.inject({
      method: 'PATCH',
      url: '/users/password',
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
      url: '/products',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: newProductPayload(),
    });

    expect(oldTokenResponse.statusCode).toBe(401);

    const loginResponse = await testApp.app.inject({
      method: 'POST',
      url: '/login',
      payload: {
        login: 'admin',
        password: 'new-admin-password',
      },
    });

    expect(loginResponse.statusCode).toBe(200);
  });

  it('rejects non-admin jwt', async () => {
    const token = testApp.app.jwt.sign({ role: 'user' });

    const response = await testApp.app.inject({
      method: 'POST',
      url: '/products',
      headers: {
        authorization: `Bearer ${token}`,
      },
      payload: newProductPayload(),
    });

    expect(response.statusCode).toBe(401);
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
