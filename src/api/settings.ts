import { apiGet, apiPatch } from './client';
import type { SettingEntry } from '../types';

export function getSettings(): Promise<{
  settings: Record<string, SettingEntry>;
  allowedKeys: string[];
}> {
  return apiGet('/admin/settings');
}

export function updateSettings(
  body: { key?: string; value?: unknown; settings?: Record<string, unknown> }
): Promise<unknown> {
  return apiPatch('/admin/settings', body);
}
