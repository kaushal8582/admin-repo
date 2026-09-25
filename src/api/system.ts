import { apiGet } from './client';

export function getSystemHealth(): Promise<Record<string, unknown>> {
  return apiGet<Record<string, unknown>>('/admin/system/health');
}
