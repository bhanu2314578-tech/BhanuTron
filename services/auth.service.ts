import { supabase } from '@/lib/supabase/client';
import type { User } from '@/types';

function mapUser(
  authUser: { id: string; email?: string; user_metadata?: Record<string, unknown> } | null
): User | null {
  if (!authUser) return null;

  const metadata = authUser.user_metadata ?? {};
  const name =
    (typeof metadata.full_name === 'string' && metadata.full_name) ||
    (typeof metadata.name === 'string' && metadata.name) ||
    authUser.email?.split('@')[0] ||
    'User';

  return {
    id: authUser.id,
    name,
    email: authUser.email ?? '',
    avatarUrl: typeof metadata.avatar_url === 'string' ? metadata.avatar_url : undefined,
  };
}

export const authService = {
  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw new Error(error.message);
    return {
      token: data.session?.access_token ?? '',
      user: mapUser(data.user)!,
    };
  },

  async signup(name: string, email: string, password: string) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: { full_name: name, name },
      },
    });
    if (error) throw new Error(error.message);
    if (!data.session) {
      throw new Error('Check your email to confirm your account before signing in.');
    }
    return {
      token: data.session.access_token,
      user: mapUser(data.user)!,
    };
  },

  async loginWithGoogle() {
    const redirectTo = `${window.location.origin}/auth/callback`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo },
    });
    if (error) throw new Error(error.message);
  },

  async logout() {
    const { error } = await supabase.auth.signOut();
    if (error) throw new Error(error.message);
  },

  async resetPassword(email: string) {
    const redirectTo = `${window.location.origin}/reset-password`;
    const { error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo });
    if (error) throw new Error(error.message);
  },

  async updatePassword(password: string) {
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw new Error(error.message);
  },

  async getSessionToken(): Promise<string | null> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token ?? null;
  },

  async getCurrentUser(): Promise<User | null> {
    const { data } = await supabase.auth.getUser();
    return mapUser(data.user);
  },

  onAuthStateChange(callback: (user: User | null, token: string | null) => void) {
    return supabase.auth.onAuthStateChange((_event, session) => {
      callback(mapUser(session?.user ?? null), session?.access_token ?? null);
    });
  },
};

export type { User };
