import { formatDate } from '../../lib/utils';
import type { ContactMessageItem } from '../../types';

export const CONTACT_SUBJECT_LABELS: Record<string, string> = {
  general: 'General',
  support: 'Support',
  billing: 'Billing',
  copyright: 'Copyright',
  partnership: 'Partnership',
  other: 'Other',
};

export const CONTACT_STATUS_LABELS: Record<string, string> = {
  NEW: 'New',
  READ: 'Read',
  REPLIED: 'Replied',
  CLOSED: 'Closed',
};

export function contactSubjectLabel(subject?: string | null): string {
  if (!subject) return 'General';
  return CONTACT_SUBJECT_LABELS[subject] || subject;
}

export function buildReplyMailto(msg: ContactMessageItem): string {
  const quoted = String(msg.message || '')
    .slice(0, 1000)
    .split('\n')
    .map((l) => `> ${l}`)
    .join('\n');
  const body = `Hi ${msg.name},\n\n\n\n---\nOn ${formatDate(msg.createdAt)}, ${msg.name} wrote:\n${quoted}`;
  const subject = `Re: Your message to MastPlayer (${contactSubjectLabel(msg.subject)})`;
  return `mailto:${encodeURIComponent(msg.email)}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}
