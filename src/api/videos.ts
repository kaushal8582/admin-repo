import { apiGet, apiPost, apiDelete } from './client';
import type { ListParams, Paginated, VideoItem } from '../types';

export function listVideos(params?: ListParams): Promise<Paginated<VideoItem>> {
  return apiGet<Paginated<VideoItem>>('/admin/videos', params);
}

export function getVideo(id: string): Promise<VideoItem> {
  return apiGet<VideoItem>(`/admin/videos/${id}`);
}

export function disableVideo(id: string, reason: string): Promise<unknown> {
  return apiPost(`/admin/videos/${id}/disable`, { reason });
}

export function restoreVideo(id: string, reason?: string): Promise<unknown> {
  return apiPost(`/admin/videos/${id}/restore`, { reason });
}

export function removeVideo(id: string, reason: string): Promise<unknown> {
  return apiPost(`/admin/videos/${id}/remove`, { reason });
}

export function deleteVideoPermanent(id: string, reason: string, confirm: string): Promise<unknown> {
  return apiDelete(`/admin/videos/${id}`, { reason, confirm });
}
