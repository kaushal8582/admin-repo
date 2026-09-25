import { apiGet } from './client';
import type { ListParams, Paginated } from '../types';

export function getStorageOverview(): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>('/admin/storage/overview');
}

export function listStorageFiles(params?: ListParams): Promise<Paginated<Record<string, unknown>>> {
  return apiGet<Paginated<Record<string, unknown>>>('/admin/storage/files', params);
}
