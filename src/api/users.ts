import { apiGet, apiPost } from './client';
import type { ListParams, Paginated, PlatformUser, UserDetail } from '../types';

export function listUsers(params?: ListParams): Promise<Paginated<PlatformUser>> {
  return apiGet<Paginated<PlatformUser>>('/admin/users', params);
}

export function getUser(id: string): Promise<UserDetail> {
  return apiGet<UserDetail>(`/admin/users/${id}`);
}

export function suspendUser(id: string, reason: string): Promise<unknown> {
  return apiPost(`/admin/users/${id}/suspend`, { reason });
}

export function unsuspendUser(id: string, reason?: string): Promise<unknown> {
  return apiPost(`/admin/users/${id}/unsuspend`, { reason });
}
