import { apiGet } from './client';
import type { AuditLogItem, ListParams, Paginated } from '../types';

export function listAuditLogs(params?: ListParams): Promise<Paginated<AuditLogItem>> {
  return apiGet<Paginated<AuditLogItem>>('/admin/audit-logs', params);
}

export function getAuditLog(id: string): Promise<AuditLogItem> {
  return apiGet<AuditLogItem>(`/admin/audit-logs/${id}`);
}
