import { CheckCircle2, Eye, ImageUp, MessageSquarePlus } from 'lucide-react';
import type { RowActionItem } from '../RowActionsMenu';
import type { WithdrawalItem } from '../../types';

export const WITHDRAWAL_STATUSES = [
  'pending',
  'under_review',
  'approved',
  'processing',
  'paid',
  'rejected',
  'cancelled',
] as const;

export const WITHDRAWAL_STATUS_LABELS: Record<string, string> = {
  pending: 'Pending',
  under_review: 'Under review',
  approved: 'Approved',
  processing: 'Processing',
  paid: 'Paid',
  rejected: 'Rejected',
  cancelled: 'Cancelled',
};

/** Mirrors Backend TRANSITIONS in adminWithdrawals.service.js */
export const WITHDRAWAL_NEXT: Record<string, string[]> = {
  pending: ['under_review', 'approved', 'rejected', 'cancelled', 'paid'],
  under_review: ['approved', 'rejected', 'cancelled'],
  approved: ['processing', 'rejected'],
  processing: ['paid', 'rejected'],
};

export const WITHDRAWAL_ACTION_LABELS: Record<string, string> = {
  under_review: 'Move to under review',
  approved: 'Approve',
  processing: 'Mark as processing',
  paid: 'Mark as paid',
  rejected: 'Reject',
  cancelled: 'Cancel request',
};

export function withdrawalStatusLabel(status?: string | null): string {
  if (!status) return 'Unknown';
  return WITHDRAWAL_STATUS_LABELS[status] || status.replace(/_/g, ' ');
}

export type WithdrawalDialogTarget =
  | { mode: 'status'; payout: WithdrawalItem; status: string }
  | { mode: 'note'; payout: WithdrawalItem }
  | { mode: 'proof'; payout: WithdrawalItem };

export function buildWithdrawalActions(
  row: WithdrawalItem,
  opts: {
    canManage: boolean;
    onView?: () => void;
    onDialog: (target: WithdrawalDialogTarget) => void;
  }
): RowActionItem[] {
  const items: RowActionItem[] = [];
  if (opts.onView) {
    items.push({
      key: 'view',
      label: 'View details',
      icon: <Eye className="h-4 w-4" />,
      onSelect: opts.onView,
    });
  }
  if (!opts.canManage) return items;

  items.push({
    key: 'note',
    label: 'Add note',
    icon: <MessageSquarePlus className="h-4 w-4" />,
    onSelect: () => opts.onDialog({ mode: 'note', payout: row }),
  });
  if (row.status === 'paid') {
    items.push({
      key: 'proof',
      label: row.hasPaymentProof ? 'Replace payment proof' : 'Upload payment proof',
      icon: <ImageUp className="h-4 w-4" />,
      onSelect: () => opts.onDialog({ mode: 'proof', payout: row }),
    });
  }

  const next = WITHDRAWAL_NEXT[row.status || ''] || [];
  if (next.length) {
    items.push({ type: 'separator', key: 'sep' });
    items.push({ type: 'label', key: 'status-label', label: 'Change status' });
    next.forEach((status) => {
      items.push({
        key: `status-${status}`,
        label: WITHDRAWAL_ACTION_LABELS[status] || withdrawalStatusLabel(status),
        icon: status === 'paid' ? <CheckCircle2 className="h-4 w-4" /> : undefined,
        danger: status === 'rejected' || status === 'cancelled',
        onSelect: () => opts.onDialog({ mode: 'status', payout: row, status }),
      });
    });
  }
  return items;
}
