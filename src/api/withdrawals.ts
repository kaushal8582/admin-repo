import { apiGet, apiPatch, apiPatchForm, apiPost, apiPostForm } from './client';
import type { ListParams, Paginated, WithdrawalDetail, WithdrawalItem } from '../types';

export function listWithdrawals(params?: ListParams): Promise<Paginated<WithdrawalItem>> {
  return apiGet<Paginated<WithdrawalItem>>('/admin/withdrawals', params);
}

export function getWithdrawal(id: string): Promise<WithdrawalDetail> {
  return apiGet<WithdrawalDetail>(`/admin/withdrawals/${id}`);
}

export interface WithdrawalStatusBody {
  status: string;
  note?: string;
  reason?: string;
  internal?: boolean;
  transactionId?: string;
  proof?: File | null;
}

export function updateWithdrawalStatus(
  id: string,
  body: WithdrawalStatusBody
): Promise<WithdrawalDetail> {
  const { proof, ...rest } = body;
  if (!proof) {
    return apiPatch<WithdrawalDetail>(`/admin/withdrawals/${id}/status`, rest);
  }
  const form = new FormData();
  Object.entries(rest).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') form.append(key, String(value));
  });
  form.append('proof', proof);
  return apiPatchForm<WithdrawalDetail>(`/admin/withdrawals/${id}/status`, form);
}

export function addWithdrawalNote(
  id: string,
  body: { note: string; internal?: boolean }
): Promise<WithdrawalDetail> {
  return apiPost<WithdrawalDetail>(`/admin/withdrawals/${id}/note`, body);
}

export function uploadWithdrawalProof(
  id: string,
  proof: File,
  transactionId?: string
): Promise<WithdrawalDetail> {
  const form = new FormData();
  form.append('proof', proof);
  if (transactionId) form.append('transactionId', transactionId);
  return apiPostForm<WithdrawalDetail>(`/admin/withdrawals/${id}/proof`, form);
}
