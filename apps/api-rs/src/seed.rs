use crate::models::{LocalizedText, Product, ProductPrices, ProductVariant};
use chrono::{TimeZone, Utc};
use std::collections::HashMap;

pub fn default_products() -> Vec<Product> {
    let now = Utc.with_ymd_and_hms(2026, 1, 1, 0, 0, 0).unwrap();
    vec![
        Product {
            id: "esp32-wroom-32d".into(),
            name: LocalizedText {
                pt: "ESP32-WROOM-32D".into(),
                en: "ESP32-WROOM-32D".into(),
                es: "ESP32-WROOM-32D".into(),
                zh: "ESP32-WROOM-32D".into(),
                ja: "ESP32-WROOM-32D".into(),
            },
            description: LocalizedText {
                pt: "Modulo Wi-Fi e Bluetooth para projetos IoT embarcados.".into(),
                en: "Wi-Fi and Bluetooth module for embedded IoT projects.".into(),
                es: "Modulo Wi-Fi y Bluetooth para proyectos IoT embebidos.".into(),
                zh: "用于嵌入式物联网项目的 Wi-Fi 和蓝牙模块。".into(),
                ja: "組み込みIoTプロジェクト向けのWi-FiおよびBluetoothモジュール。".into(),
            },
            image_url: Some(
                "https://images.unsplash.com/photo-1553406830-ef2513020d76?q=80&w=400&auto=format&fit=crop"
                    .into(),
            ),
            variants: vec![ProductVariant {
                id: "esp32-wroom-32d-default".into(),
                sku: "ESP32-WROOM-32D".into(),
                attributes: HashMap::from([("model".into(), "ESP32-WROOM-32D".into())]),
                prices: ProductPrices {
                    brl_cents: 4590,
                    usd_cents: 899,
                },
                stock: 25,
                active: true,
            }],
            active: true,
            created_at: now,
            updated_at: now,
        },
        Product {
            id: "sensor-dht22".into(),
            name: LocalizedText {
                pt: "SENSOR DHT22".into(),
                en: "DHT22 SENSOR".into(),
                es: "SENSOR DHT22".into(),
                zh: "DHT22 传感器".into(),
                ja: "DHT22 センサー".into(),
            },
            description: LocalizedText {
                pt: "Sensor digital de temperatura e umidade para bancadas de prototipagem, estufas pequenas e validacoes de campo. O DHT22 entrega leituras estaveis em ciclos de monitoramento ambiental, facilitando testes com ESP32, dashboards locais e automacoes simples antes da instalacao definitiva.".into(),
                en: "Digital temperature and humidity sensor for prototyping benches, small grow rooms, and field validation. The DHT22 provides stable readings for environmental monitoring cycles, making it useful for ESP32 tests, local dashboards, and simple automations before a final installation.".into(),
                es: "Sensor digital de temperatura y humedad para bancos de prototipado, pequenos invernaderos y validaciones de campo. El DHT22 ofrece lecturas estables para ciclos de monitoreo ambiental, facilitando pruebas con ESP32, dashboards locales y automatizaciones simples antes de una instalacion definitiva.".into(),
                zh: "用于原型台、小型种植空间和现场验证的数字温湿度传感器。DHT22 可为环境监测周期提供稳定读数，适合在最终安装前进行 ESP32 测试、本地仪表盘和简单自动化验证。".into(),
                ja: "プロトタイピングベンチ、小規模な栽培環境、現場検証向けのデジタル温湿度センサーです。DHT22は環境モニタリング周期で安定した読み取りを提供し、本設置前のESP32テスト、ローカルダッシュボード、簡易自動化の確認に役立ちます。".into(),
            },
            image_url: Some(
                "https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=400&auto=format&fit=crop"
                    .into(),
            ),
            variants: vec![ProductVariant {
                id: "sensor-dht22-default".into(),
                sku: "SENSOR-DHT22".into(),
                attributes: HashMap::from([("model".into(), "DHT22".into())]),
                prices: ProductPrices {
                    brl_cents: 3290,
                    usd_cents: 649,
                },
                stock: 40,
                active: true,
            }],
            active: true,
            created_at: now,
            updated_at: now,
        },
    ]
}
