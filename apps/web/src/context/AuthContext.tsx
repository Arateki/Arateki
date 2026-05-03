import { useState, useEffect } from 'react';
import { AuthContext } from './auth';
import { authService } from '../services/authService';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(() => authService.getToken());

  // Listen to storage events to sync token across tabs if needed.
  useEffect(() => {
    const handleStorage = () => {
      setToken(authService.getToken());
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  useEffect(() => {
    if (!token) return;

    const expiresAt = authService.getTokenExpiry(token);
    if (!expiresAt) return;

    const renewBeforeMs = 5 * 60 * 1000;
    const timeUntilRenewal = expiresAt - Date.now() - renewBeforeMs;
    let cancelled = false;

    const renew = async () => {
      try {
        const nextToken = await authService.refreshToken(token);
        if (!cancelled) setToken(nextToken);
      } catch {
        authService.removeToken();
        if (!cancelled) setToken(null);
      }
    };

    if (expiresAt <= Date.now()) {
      authService.removeToken();
      const timeout = window.setTimeout(() => setToken(null), 0);
      return () => window.clearTimeout(timeout);
    }

    if (timeUntilRenewal <= 0) {
      void renew();
      return () => {
        cancelled = true;
      };
    }

    const timeout = window.setTimeout(() => {
      void renew();
    }, timeUntilRenewal);

    return () => {
      cancelled = true;
      window.clearTimeout(timeout);
    };
  }, [token]);

  const login = (newToken: string) => {
    authService.setToken(newToken);
    setToken(newToken);
  };

  const logout = async () => {
    await authService.logout();
    setToken(null);
  };

  return (
    <AuthContext.Provider value={{
      token,
      isAuthenticated: !!token,
      login,
      logout
    }}>
      {children}
    </AuthContext.Provider>
  );
}
