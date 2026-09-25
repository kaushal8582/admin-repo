import { apiGet, apiPost } from './client';
import type { LedgerItem, ListParams, Paginated } from '../types';

export function listEarnings(params?: ListParams): Promise<Paginated<LedgerItem>> {
  return apiGet<Paginated<LedgerItem>>('/admin/earnings', params);
}

export function adjustEarnings(body: {
  userId: string;
  amount: number;
  reason: string;
  balanceField?: string;
  idempotencyKey?: string;
}): Promise<unknown> {
  return apiPost('/admin/earnings/adjust', body);
}
