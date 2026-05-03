import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, act } from '@testing-library/react';
import { AuthProvider } from './AuthContext';
import { useAuth } from './useAuth';
import { authService } from '../services/authService';

describe('AuthContext', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('should start with initial token from service', () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('init-token');
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.token).toBe('init-token');
    expect(result.current.isAuthenticated).toBe(true);
  });

  it('should update state on login', () => {
    vi.spyOn(authService, 'getToken').mockReturnValue(null);
    const setTokenSpy = vi.spyOn(authService, 'setToken');
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    act(() => {
      result.current.login('new-token');
    });

    expect(result.current.token).toBe('new-token');
    expect(result.current.isAuthenticated).toBe(true);
    expect(setTokenSpy).toHaveBeenCalledWith('new-token');
  });

  it('should clear state on logout', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue('token');
    const logoutSpy = vi.spyOn(authService, 'logout').mockResolvedValue();
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    await act(async () => {
      await result.current.logout();
    });

    expect(result.current.token).toBeNull();
    expect(result.current.isAuthenticated).toBe(false);
    expect(logoutSpy).toHaveBeenCalled();
  });

  it('should sync with other tabs via storage event', async () => {
    vi.spyOn(authService, 'getToken').mockReturnValue(null);
    const { result } = renderHook(() => useAuth(), {
      wrapper: AuthProvider
    });

    expect(result.current.token).toBeNull();

    // Simulate storage change in another tab
    vi.spyOn(authService, 'getToken').mockReturnValue('remote-token');
    act(() => {
      window.dispatchEvent(new Event('storage'));
    });

    expect(result.current.token).toBe('remote-token');
  });
});
