const TOKEN_KEY = 'arateki-admin-token';
const API_URL = import.meta.env.VITE_API_URL || '/api';

export const authService = {
  getToken(): string | null {
    return sessionStorage.getItem(TOKEN_KEY);
  },

  setToken(token: string): void {
    sessionStorage.setItem(TOKEN_KEY, token);
  },

  removeToken(): void {
    sessionStorage.removeItem(TOKEN_KEY);
  },

  getTokenExpiry(token: string): number | null {
    const [, payload] = token.split('.');
    if (!payload) return null;

    try {
      const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
      const padded = normalized.padEnd(Math.ceil(normalized.length / 4) * 4, '=');
      const decoded = JSON.parse(atob(padded)) as { exp?: unknown };
      return typeof decoded.exp === 'number' ? decoded.exp * 1000 : null;
    } catch {
      return null;
    }
  },

  async login(login: string, password: string): Promise<string> {
    const response = await fetch(`${API_URL}/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ login, password }),
    });

    if (!response.ok) {
      throw new Error('Credenciais inválidas');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data.token;
  },

  async refreshToken(token: string): Promise<string> {
    const response = await fetch(`${API_URL}/refresh`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      },
    });

    if (!response.ok) {
      throw new Error('Sessão expirada');
    }

    const data = await response.json();
    this.setToken(data.token);
    return data.token;
  },

  async logout(): Promise<void> {
    const token = this.getToken();
    if (token) {
      await fetch(`${API_URL}/logout`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
      }).catch(() => {}); // Ignore errors on logout
    }
    this.removeToken();
  }
};
