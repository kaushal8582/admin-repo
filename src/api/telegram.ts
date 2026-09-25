import { apiGet, apiPost, apiPatch } from './client';
import type { ListParams, Paginated } from '../types';

export function getTelegramOverview(): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>('/admin/telegram/overview');
}

export function listTelegramUsers(params?: ListParams): Promise<Paginated<Record<string, unknown>>> {
  return apiGet<Paginated<Record<string, unknown>>>('/admin/telegram/users', params);
}

export function disconnectTelegramUser(id: string, reason?: string): Promise<unknown> {
  return apiPost(`/admin/telegram/users/${id}/disconnect`, { reason });
}

export function listTelegramGroups(params?: ListParams): Promise<Paginated<Record<string, unknown>>> {
  return apiGet<Paginated<Record<string, unknown>>>('/admin/telegram/groups', params);
}

export function listTelegramChannels(params?: ListParams): Promise<Paginated<Record<string, unknown>>> {
  return apiGet<Paginated<Record<string, unknown>>>('/admin/telegram/channels', params);
}

export function disableDestination(id: string, reason?: string): Promise<unknown> {
  return apiPatch(`/admin/telegram/destinations/${id}/disable`, { reason });
}
