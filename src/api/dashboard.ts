import { apiGet } from './client';
import type { DashboardData } from '../types';

export function getDashboard(range: string = '30d'): Promise<DashboardData> {
  return apiGet<DashboardData>('/admin/dashboard', { range });
}
