import { apiGet, apiPatch } from './client';
import type { ListParams, Paginated, ReportItem } from '../types';

export function listReports(params?: ListParams): Promise<Paginated<ReportItem>> {
  return apiGet<Paginated<ReportItem>>('/admin/reports', params);
}

export function getReport(id: string): Promise<ReportItem> {
  return apiGet<ReportItem>(`/admin/reports/${id}`);
}

export function updateReport(
  id: string,
  body: {
    status: string;
    adminNotes?: string;
    actionTaken?: string;
    disableVideo?: boolean;
    reason?: string;
  }
): Promise<ReportItem> {
  return apiPatch<ReportItem>(`/admin/reports/${id}`, body);
}
