import '@testing-library/jest-dom';

// Sob Node 22+ o jsdom deste ambiente não expõe localStorage/sessionStorage
// (window.localStorage === undefined). Instala um Storage em memória em window e
// globalThis para os testes que dependem de localStorage "puro".
function createMemoryStorage(): Storage {
  const store = new Map<string, string>();
  return {
    get length(): number { return store.size; },
    clear(): void { store.clear(); },
    getItem(key: string): string | null { return store.get(key) ?? null; },
    key(index: number): string | null { return Array.from(store.keys())[index] ?? null; },
    removeItem(key: string): void { store.delete(key); },
    setItem(key: string, value: string): void { store.set(key, String(value)); },
  } as Storage;
}

if (typeof window !== 'undefined' && !window.localStorage) {
  for (const name of ['localStorage', 'sessionStorage'] as const) {
    const storage = createMemoryStorage();
    Object.defineProperty(window, name, { value: storage, configurable: true });
    Object.defineProperty(globalThis, name, { value: storage, configurable: true });
  }
}
