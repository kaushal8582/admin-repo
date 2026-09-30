import { apiGet, apiPatch } from './client';
import type { ContactMessageItem, ContactStats, ListParams, Paginated } from '../types';

export function listContactMessages(params?: ListParams): Promise<Paginated<ContactMessageItem>> {
  return apiGet<Paginated<ContactMessageItem>>('/admin/contact-messages', params);
}

export function getContactStats(): Promise<ContactStats> {
  return apiGet<ContactStats>('/admin/contact-messages/stats');
}

export function getContactMessage(id: string): Promise<ContactMessageItem> {
  return apiGet<ContactMessageItem>(`/admin/contact-messages/${id}`);
}

export function updateContactMessage(
  id: string,
  body: { status?: string; adminNotes?: string | null }
): Promise<ContactMessageItem> {
  return apiPatch<ContactMessageItem>(`/admin/contact-messages/${id}`, body);
}
