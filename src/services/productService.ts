import type { Product } from '../types/product';

const MOCK_PRODUCTS: Product[] = [
  {
    id: '1',
    name: 'ESP32-WROOM-32D',
    description: 'Módulo microcontrolador potente com Wi-Fi e Bluetooth integrados. Ideal para projetos IoT.',
    price: 45.90,
    currency: 'BRL',
    image: 'https://images.unsplash.com/photo-1553406830-ef2513020d76?q=80&w=400&auto=format&fit=crop',
    category: 'Microcontroladores'
  },
  {
    id: '2',
    name: 'Sensor DHT22',
    description: 'Sensor de alta precisão para medição de temperatura e umidade relativa do ar.',
    price: 32.50,
    currency: 'BRL',
    image: 'https://images.unsplash.com/photo-1555664424-778a1e5e1b48?q=80&w=400&auto=format&fit=crop',
    category: 'Sensores'
  },
  {
    id: '3',
    name: 'Módulo Painel Solar 6V 1W',
    description: 'Painel solar compacto e eficiente para alimentar pequenos dispositivos e carregar baterias.',
    price: 18.00,
    currency: 'BRL',
    image: 'https://images.unsplash.com/photo-1508514177221-188b171f267a?q=80&w=400&auto=format&fit=crop',
    category: 'Energia'
  },
  {
    id: '4',
    name: 'Sensor de Umidade de Solo Capacitivo',
    description: 'Sensor resistente à corrosão para medir com precisão a umidade do solo em vasos e hortas.',
    price: 15.20,
    currency: 'BRL',
    image: 'https://images.unsplash.com/photo-1585314062340-f1a5a7c9328d?q=80&w=400&auto=format&fit=crop',
    category: 'Sensores'
  }
];

export const productService = {
  async getProducts(): Promise<Product[]> {
    // Simulando atraso de rede
    return new Promise((resolve) => {
      setTimeout(() => {
        resolve(MOCK_PRODUCTS);
      }, 800);
    });
  }
};
