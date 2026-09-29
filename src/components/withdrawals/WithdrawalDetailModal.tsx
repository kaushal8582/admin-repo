import { useEffect, type ReactNode } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Copy, ExternalLink, Lock, X } from 'lucide-react';
import { getWithdrawal } from '../../api/withdrawals';
import { StatusBadge } from '../StatusBadge';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { RowActionsMenu } from '../RowActionsMenu';
import { cn, formatDate, formatUsd, getErrorMessage } from '../../lib/utils';
import type { WithdrawalEvent } from '../../types';
import {
  buildWithdrawalActions,
  withdrawalStatusLabel,
  type WithdrawalDialogTarget,
} from './withdrawalStatus';

const DOT: Record<string, string> = {
  pending: 'bg-amber-400',
  under_review: 'bg-amber-400',
  approved: 'bg-sky-400',
  processing: 'bg-violet-400',
  paid: 'bg-emerald-400',
  rejected: 'bg-red-400',
  cancelled: 'bg-slate-400',
};

function eventTitle(e: WithdrawalEvent): string {
  switch (e.type) {
    case 'created':
      return 'Payout requested';
    case 'status_changed':
      return `${withdrawalStatusLabel(e.fromStatus)} → ${withdrawalStatusLabel(e.toStatus)}`;
    case 'note':
      return 'Note added';
    case 'proof_uploaded':
      return 'Payment proof uploaded';
    default:
      return 'Update';
  }
}

function eventDot(e: WithdrawalEvent): string {
  if (e.type === 'created') return DOT.pending;
  if (e.type === 'status_changed') return DOT[e.toStatus || ''] || 'bg-slate-400';
  if (e.type === 'proof_uploaded') return DOT.paid;
  return 'bg-slate-400';
}

function copy(value: string, label: string) {
  navigator.clipboard
    .writeText(value)
    .then(() => toast.success(`${label} copied`))
    .catch(() => toast.error('Could not copy'));
}

function Field({ label, value, mono, copyable }: { label: string; value?: string | null; mono?: boolean; copyable?: boolean }) {
  return (
    <div>
      <p className="text-xs uppercase tracking-wide text-muted">{label}</p>
      <p className={cn('mt-0.5 flex items-center gap-1.5 break-all text-sm text-foreground', mono && 'font-mono')}>
        {value || '—'}
        {copyable && value ? (
          <button
            type="button"
            onClick={() => copy(value, label)}
            className="rounded p-0.5 text-muted hover:text-foreground"
            aria-label={`Copy ${label}`}
          >
            <Copy className="h-3.5 w-3.5" />
          </button>
        ) : null}
      </p>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section>
      <h3 className="mb-2 text-xs font-medium uppercase tracking-wide text-muted">{title}</h3>
      {children}
    </section>
  );
}

interface WithdrawalDetailModalProps {
  payoutId: string | null;
  canManage: boolean;
  onClose: () => void;
  onDialog: (target: WithdrawalDialogTarget) => void;
  /** True while an action dialog is stacked on top. */
  escapeDisabled?: boolean;
}

export function WithdrawalDetailModal({
  payoutId,
  canManage,
  onClose,
  onDialog,
  escapeDisabled = false,
}: WithdrawalDetailModalProps) {
  const { data, isLoading, error } = useQuery({
    queryKey: ['withdrawal', payoutId],
    queryFn: () => getWithdrawal(payoutId as string),
    enabled: Boolean(payoutId),
  });

  useEffect(() => {
    if (!payoutId || escapeDisabled) return undefined;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [payoutId, onClose, escapeDisabled]);

  if (!payoutId) return null;

  const snap = data?.paymentSnapshot || {};
  const actions = data ? buildWithdrawalActions(data, { canManage, onDialog }) : [];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          <div>
            <p className="text-xs uppercase tracking-wide text-muted">Withdrawal</p>
            <p className="mt-1 font-display text-2xl font-semibold text-foreground">
              {data ? formatUsd(data.amountUsd) : '—'}
            </p>
            {data ? (
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={data.status} />
                <span className="text-xs text-muted">Requested {formatDate(data.createdAt)}</span>
              </div>
            ) : null}
          </div>
          <div className="flex items-center gap-1">
            {actions.length ? <RowActionsMenu items={actions} /> : null}
            <button
              type="button"
              onClick={onClose}
              className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 space-y-6 overflow-y-auto p-5">
          {isLoading ? (
            <LoadingSkeleton rows={6} />
          ) : error ? (
            <p className="text-sm text-red-300">{getErrorMessage(error)}</p>
          ) : data ? (
            <>
              <div className="grid gap-6 sm:grid-cols-2">
                <Section title="Creator">
                  <div className="space-y-2">
                    <Field label="Name" value={data.user?.name} />
                    <Field label="Email" value={data.user?.email} />
                    {data.user?.id ? (
                      <Link to={`/users/${data.user.id}`} className="inline-flex items-center gap-1 text-xs text-sky-300 hover:underline">
                        Open user <ExternalLink className="h-3 w-3" />
                      </Link>
                    ) : null}
                  </div>
                </Section>
                <Section title={`Pay via ${data.method === 'upi' ? 'UPI' : 'bank transfer'}`}>
                  <div className="space-y-2">
                    <Field label="Account name" value={snap.accountName} copyable />
                    {data.method === 'upi' ? (
                      <Field label="UPI ID" value={snap.upiId} mono copyable />
                    ) : (
                      <>
                        <Field label="Account number" value={snap.accountNumber} mono copyable />
                        <Field label="IFSC" value={snap.ifsc} mono copyable />
                      </>
                    )}
                  </div>
                </Section>
              </div>

              {data.status === 'paid' || data.transactionId || data.paymentProofUrl ? (
                <Section title="Payment">
                  <div className="space-y-3">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Transaction ID" value={data.transactionId} mono copyable />
                      <Field label="Paid at" value={data.paidAt ? formatDate(data.paidAt) : null} />
                    </div>
                    {data.paymentProofUrl ? (
                      <a
                        href={data.paymentProofUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="block overflow-hidden rounded-lg border border-border"
                      >
                        <img src={data.paymentProofUrl} alt="Payment proof" className="max-h-72 w-full bg-surface object-contain" />
                      </a>
                    ) : (
                      <p className="text-xs text-muted">No payment screenshot uploaded.</p>
                    )}
                  </div>
                </Section>
              ) : null}

              {data.status === 'rejected' && data.rejectionReason ? (
                <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm">
                  <p className="font-medium text-red-300">Rejection reason</p>
                  <p className="mt-1 text-muted">{data.rejectionReason}</p>
                </div>
              ) : null}

              <Section title="Activity">
                <ol className="relative ml-1.5 space-y-5 border-l border-border">
                  {data.timeline.map((e) => (
                    <li key={e.id} className="relative pl-5">
                      <span
                        className={cn(
                          'absolute -left-[5px] top-1.5 h-2.5 w-2.5 rounded-full ring-4 ring-[var(--surface-elevated,#121a2e)]',
                          eventDot(e)
                        )}
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-medium text-foreground">{eventTitle(e)}</p>
                        {e.internal ? (
                          <span className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/10 px-1.5 py-0.5 text-[10px] font-medium uppercase text-amber-300">
                            <Lock className="h-3 w-3" /> Internal
                          </span>
                        ) : null}
                      </div>
                      <p className="text-xs text-muted">
                        {e.actorName || (e.actorType === 'user' ? 'Creator' : 'Admin')} · {formatDate(e.createdAt)}
                      </p>
                      {e.note ? (
                        <p className="mt-2 whitespace-pre-wrap rounded-lg bg-surface px-3 py-2 text-sm text-muted">{e.note}</p>
                      ) : null}
                      {e.transactionId ? (
                        <p className="mt-1.5 text-xs text-muted">
                          Transaction ID: <span className="font-mono text-foreground">{e.transactionId}</span>
                        </p>
                      ) : null}
                    </li>
                  ))}
                </ol>
              </Section>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}
