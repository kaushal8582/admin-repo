import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';
import * as authApi from '../api/auth';
import { clearTokens, getAccessToken } from '../api/client';
import type { AdminUser, AuthSession, Permission } from '../types';
import { getErrorMessage } from '../lib/utils';

interface AuthContextValue {
  user: AdminUser | null;
  permissions: Permission[];
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthSession>;
  verify2fa: (pendingToken: string, code: string) => Promise<AuthSession>;
  logout: () => Promise<void>;
  hasPermission: (permission: string | string[]) => boolean;
  refreshMe: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshMe = useCallback(async () => {
    const token = getAccessToken();
    if (!token) {
      setUser(null);
      return;
    }
    const me = await authApi.fetchMe();
    setUser(me);
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        if (getAccessToken()) {
          await refreshMe();
        }
      } catch {
        clearTokens();
        if (!cancelled) setUser(null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshMe]);

  const login = useCallback(async (email: string, password: string) => {
    const session = await authApi.login(email, password);
    if (!session.requires2fa && session.user) {
      setUser(session.user);
    }
    return session;
  }, []);

  const verify2fa = useCallback(async (pendingToken: string, code: string) => {
    const session = await authApi.verify2fa(pendingToken, code);
    if (session.user) setUser(session.user);
    return session;
  }, []);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      clearTokens();
    }
    setUser(null);
  }, []);

  const permissions = user?.permissions ?? [];

  const hasPermission = useCallback(
    (permission: string | string[]) => {
      if (!user) return false;
      const list = Array.isArray(permission) ? permission : [permission];
      return list.some((p) => permissions.includes(p as Permission));
    },
    [user, permissions]
  );

  const value = useMemo(
    () => ({
      user,
      permissions,
      loading,
      login,
      verify2fa,
      logout,
      hasPermission,
      refreshMe,
    }),
    [user, permissions, loading, login, verify2fa, logout, hasPermission, refreshMe]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}

export { getErrorMessage };
