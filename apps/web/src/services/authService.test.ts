import { describe, it, expect, vi, beforeEach } from 'vitest';
import { authService } from './authService';

describe('authService', () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it('should manage token in sessionStorage', () => {
    authService.setToken('test-token');
    expect(authService.getToken()).toBe('test-token');
    expect(sessionStorage.getItem('arateki-admin-token')).toBe('test-token');

    authService.removeToken();
    expect(authService.getToken()).toBeNull();
  });

  it('should login successfully and return token', async () => {
    const mockToken = 'jwt-token';
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: mockToken }),
    }));

    const token = await authService.login('admin', 'password');

    expect(token).toBe(mockToken);
    expect(authService.getToken()).toBe(mockToken);
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/login'), expect.objectContaining({
      method: 'POST',
      body: JSON.stringify({ login: 'admin', password: 'password' }),
    }));
  });

  it('should throw error on failed login', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: false,
    }));

    await expect(authService.login('admin', 'wrong')).rejects.toThrow('Credenciais inválidas');
  });

  it('should logout and call API if token exists', async () => {
    authService.setToken('test-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true }));

    await authService.logout();

    expect(authService.getToken()).toBeNull();
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/logout'), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer test-token',
      }),
    }));
  });

  it('should logout and just clear storage if no token exists', async () => {
    const fetchSpy = vi.fn();
    vi.stubGlobal('fetch', fetchSpy);

    await authService.logout();

    expect(authService.getToken()).toBeNull();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should refresh token and store the new value', async () => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ token: 'next-token' }),
    }));

    const token = await authService.refreshToken('current-token');

    expect(token).toBe('next-token');
    expect(authService.getToken()).toBe('next-token');
    expect(fetch).toHaveBeenCalledWith(expect.stringContaining('/refresh'), expect.objectContaining({
      method: 'POST',
      headers: expect.objectContaining({
        'Authorization': 'Bearer current-token',
      }),
    }));
  });
});
