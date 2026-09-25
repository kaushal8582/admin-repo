import { apiGet, apiPost, setTokens, clearTokens } from './client';
import type { AdminUser, AuthSession } from '../types';

export async function login(email: string, password: string): Promise<AuthSession> {
  const data = await apiPost<AuthSession>('/admin/auth/login', { email, password });
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function verify2fa(pendingToken: string, code: string): Promise<AuthSession> {
  const data = await apiPost<AuthSession>('/admin/auth/2fa/verify', { pendingToken, code });
  if (data.accessToken && data.refreshToken) {
    setTokens(data.accessToken, data.refreshToken);
  }
  return data;
}

export async function fetchMe(): Promise<AdminUser> {
  const data = await apiGet<{ user: AdminUser }>('/admin/auth/me');
  return data.user;
}

export async function logout(revokeAll = false): Promise<void> {
  try {
    await apiPost('/admin/auth/logout', { revokeAll });
  } finally {
    clearTokens();
  }
}
