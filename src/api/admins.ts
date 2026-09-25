import { apiGet, apiPatch, apiPost } from './client';
import type { AdminUser, ListParams, Paginated } from '../types';

export function listAdmins(params?: ListParams): Promise<Paginated<AdminUser>> {
  return apiGet<Paginated<AdminUser>>('/admin/admins', params);
}

export function updateAdminRole(id: string, role: string, reason?: string): Promise<AdminUser> {
  return apiPatch<AdminUser>(`/admin/admins/${id}/role`, { role, reason });
}

export function disableAdmin(id: string, mode?: string, reason?: string): Promise<unknown> {
  return apiPost(`/admin/admins/${id}/disable`, { mode, reason });
}
