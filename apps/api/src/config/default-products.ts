import type { Product } from '../domain/product.js';

const now = new Date('2026-01-01T00:00:00.000Z');

export const defaultProducts: Product[] = [
  {
    id: 'esp32-wroom-32d',
    name: {
      pt: 'ESP32-WROOM-32D',
      en: 'ESP32-WROOM-32D',
      es: 'ESP32-WROOM-32D',
      zh: 'ESP32-WROOM-32D',
      ja: 'ESP32-WROOM-32D',
    },
    description: {
      pt: 'Modulo Wi-Fi e Bluetooth para projetos IoT embarcados.',
      en: 'Wi-Fi and Bluetooth module for embedded IoT projects.',
      es: 'Modulo Wi-Fi y Bluetooth para proyectos IoT embebidos.',
      zh: '用于嵌入式物联网项目的 Wi-Fi 和蓝牙模块。',
      ja: '組み込みIoTプロジェクト向けのWi-FiおよびBluetoothモジュール。',
    },
    variants: [
      {
        id: 'esp32-wroom-32d-default',
        sku: 'ESP32-WROOM-32D',
        attributes: {
          model: 'ESP32-WROOM-32D',
        },
        prices: {
          brlCents: 4590,
          usdCents: 899,
        },
        stock: 25,
        active: true,
      },
    ],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
  {
    id: 'sensor-dht22',
    name: {
      pt: 'SENSOR DHT22',
      en: 'DHT22 SENSOR',
      es: 'SENSOR DHT22',
      zh: 'DHT22 传感器',
      ja: 'DHT22 センサー',
    },
    description: {
      pt: 'Sensor digital de temperatura e umidade.',
      en: 'Digital temperature and humidity sensor.',
      es: 'Sensor digital de temperatura y humedad.',
      zh: '数字温湿度传感器。',
      ja: 'デジタル温湿度センサー。',
    },
    variants: [
      {
        id: 'sensor-dht22-default',
        sku: 'SENSOR-DHT22',
        attributes: {
          model: 'DHT22',
        },
        prices: {
          brlCents: 3290,
          usdCents: 649,
        },
        stock: 40,
        active: true,
      },
    ],
    active: true,
    createdAt: now,
    updatedAt: now,
  },
];
