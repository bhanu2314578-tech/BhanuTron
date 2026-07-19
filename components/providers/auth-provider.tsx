'use client';

import * as React from 'react';
import { useRouter, usePathname } from 'next/navigation';

import { authService } from '@/services/auth.service';
import { tokenStorage } from '@/lib/token';
import type { User } from '@/types';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  signup: (name: string, email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = React.createContext<AuthContextValue | null>(null);

const PROTECTED_PREFIX = '/dashboard';
const AUTH_ROUTES = ['/login', '/signup', '/forgot-password', '/reset-password'];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [user, setUser] = React.useState<User | null>(null);
  const [token, setToken] = React.useState<string | null>(null);
  const [isLoading, setIsLoading] = React.useState(true);

  React.useEffect(() => {
    const storedToken = tokenStorage.get();
    setToken(storedToken);
    setIsLoading(false);
  }, []);

  React.useEffect(() => {
    if (isLoading) return;

    const isProtected = pathname?.startsWith(PROTECTED_PREFIX);
    const isAuthRoute = AUTH_ROUTES.includes(pathname ?? '');

    if (isProtected && !token) {
      router.replace('/login');
    } else if (isAuthRoute && token) {
      router.replace('/dashboard');
    }
  }, [token, pathname, isLoading, router]);

  const login = React.useCallback(async (email: string, password: string) => {
    const res = await authService.login(email, password);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const signup = React.useCallback(
    async (name: string, email: string, password: string) => {
      const res = await authService.signup(name, email, password);
      setToken(res.token);
      setUser(res.user);
    },
    []
  );

  const logout = React.useCallback(async () => {
    await authService.logout();
    setToken(null);
    setUser(null);
    router.replace('/login');
  }, [router]);

  const value = React.useMemo<AuthContextValue>(
    () => ({
      user,
      token,
      isAuthenticated: !!token,
      isLoading,
      login,
      signup,
      logout,
    }),
    [user, token, isLoading, login, signup, logout]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = React.useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
