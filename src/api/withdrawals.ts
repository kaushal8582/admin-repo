import { apiGet, apiPatch } from './client';
import type { ListParams, Paginated, WithdrawalItem } from '../types';

export function listWithdrawals(params?: ListParams): Promise<Paginated<WithdrawalItem>> {
  return apiGet<Paginated<WithdrawalItem>>('/admin/withdrawals', params);
}

export function getWithdrawal(id: string): Promise<WithdrawalItem> {
  return apiGet<WithdrawalItem>(`/admin/withdrawals/${id}`);
}

export function updateWithdrawalStatus(
  id: string,
  body: { status?: string; action?: string; note?: string; reason?: string; adminNote?: string }
): Promise<WithdrawalItem> {
  return apiPatch<WithdrawalItem>(`/admin/withdrawals/${id}/status`, body);
}
