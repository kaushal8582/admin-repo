import { apiGet } from './client';
import type { ListParams, OgLinkItem, Paginated } from '../types';

export function getOgEarnOverview(): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>('/admin/og-earn/overview');
}

export function listOgLinks(params?: ListParams): Promise<Paginated<OgLinkItem>> {
  return apiGet<Paginated<OgLinkItem>>('/admin/og-earn/links', params);
}

export function getUserOgEarn(userId: string): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>(`/admin/og-earn/users/${userId}`);
}
