import { apiRequest } from '@/services/api-client';
import { API_ROUTES } from '@/constants/api-routes';
import { tokenStorage } from '@/lib/token';
import type { AuthResponse, User } from '@/types';

export const authService = {
  async login(email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>(API_ROUTES.auth.login, {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Login failed');
    }
    tokenStorage.set(res.data.token);
    return res.data;
  },

  async signup(name: string, email: string, password: string): Promise<AuthResponse> {
    const res = await apiRequest<AuthResponse>(API_ROUTES.auth.signup, {
      method: 'POST',
      body: JSON.stringify({ name, email, password }),
    });
    if (res.error || !res.data) {
      throw new Error(res.error ?? 'Signup failed');
    }
    tokenStorage.set(res.data.token);
    return res.data;
  },

  async logout(): Promise<void> {
    try {
      await apiRequest(API_ROUTES.auth.logout, { method: 'POST' });
    } catch {
      // Best-effort — clear token regardless
    }
    tokenStorage.clear();
  },

  getToken(): string | null {
    return tokenStorage.get();
  },

  isAuthenticated(): boolean {
    return !!tokenStorage.get();
  },
};

export type { User };
