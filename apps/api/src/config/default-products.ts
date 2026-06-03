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
    imageUrl: 'https://images.unsplash.com/photo-1553406830-ef2513020d76?q=80&w=400&auto=format&fit=crop',
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
      pt: 'Sensor digital de temperatura e umidade para bancadas de prototipagem, estufas pequenas e validacoes de campo. O DHT22 entrega leituras estaveis em ciclos de monitoramento ambiental, facilitando testes com ESP32, dashboards locais e automacoes simples antes da instalacao definitiva.',
      en: 'Digital temperature and humidity sensor for prototyping benches, small grow rooms, and field validation. The DHT22 provides stable readings for environmental monitoring cycles, making it useful for ESP32 tests, local dashboards, and simple automations before a final installation.',
      es: 'Sensor digital de temperatura y humedad para bancos de prototipado, pequenos invernaderos y validaciones de campo. El DHT22 ofrece lecturas estables para ciclos de monitoreo ambiental, facilitando pruebas con ESP32, dashboards locales y automatizaciones simples antes de una instalacion definitiva.',
      zh: '用于原型台、小型种植空间和现场验证的数字温湿度传感器。DHT22 可为环境监测周期提供稳定读数，适合在最终安装前进行 ESP32 测试、本地仪表盘和简单自动化验证。',
      ja: 'プロトタイピングベンチ、小規模な栽培環境、現場検証向けのデジタル温湿度センサーです。DHT22は環境モニタリング周期で安定した読み取りを提供し、本設置前のESP32テスト、ローカルダッシュボード、簡易自動化の確認に役立ちます。',
    },
    imageUrl: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=400&auto=format&fit=crop',
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
