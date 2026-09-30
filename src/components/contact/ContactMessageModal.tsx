import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCheck, Copy, Mail, RotateCcw, X, XCircle } from 'lucide-react';
import { getContactMessage, updateContactMessage } from '../../api/contact';
import { StatusBadge } from '../StatusBadge';
import { LoadingSkeleton } from '../LoadingSkeleton';
import { formatDate, getErrorMessage } from '../../lib/utils';
import { buildReplyMailto, contactSubjectLabel } from './contactLabels';

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--input-focus-ring)]';

interface ContactMessageModalProps {
  messageId: string | null;
  canManage: boolean;
  onClose: () => void;
}

export function ContactMessageModal({ messageId, canManage, onClose }: ContactMessageModalProps) {
  if (!messageId) return null;
  return <ModalBody key={messageId} messageId={messageId} canManage={canManage} onClose={onClose} />;
}

function ModalBody({
  messageId,
  canManage,
  onClose,
}: {
  messageId: string;
  canManage: boolean;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const [notesDraft, setNotesDraft] = useState<string | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['contact-message', messageId],
    queryFn: () => getContactMessage(messageId),
  });

  // Opening a NEW message marks it READ server-side; refresh list + counters.
  useEffect(() => {
    if (!data?.id) return;
    void qc.invalidateQueries({ queryKey: ['contact-messages'] });
    void qc.invalidateQueries({ queryKey: ['contact-stats'] });
  }, [data?.id, qc]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const mutation = useMutation({
    mutationFn: (body: { status?: string; adminNotes?: string | null }) =>
      updateContactMessage(messageId, body),
    onSuccess: (updated, body) => {
      qc.setQueryData(['contact-message', messageId], updated);
      void qc.invalidateQueries({ queryKey: ['contact-messages'] });
      void qc.invalidateQueries({ queryKey: ['contact-stats'] });
      if (body.adminNotes !== undefined) setNotesDraft(null);
      toast.success(body.status ? 'Status updated' : 'Notes saved');
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const notes = notesDraft ?? data?.adminNotes ?? '';
  const notesDirty = notesDraft !== null && notesDraft !== (data?.adminNotes ?? '');

  const copyEmail = () => {
    if (!data) return;
    navigator.clipboard
      .writeText(data.email)
      .then(() => toast.success('Email copied'))
      .catch(() => toast.error('Could not copy'));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button type="button" className="absolute inset-0 bg-black/60" aria-label="Close" onClick={onClose} />
      <div
        role="dialog"
        aria-modal="true"
        className="relative flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-border bg-surface-elevated shadow-xl"
      >
        <div className="flex items-start justify-between gap-3 border-b border-border p-5">
          {data ? (
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted">
                Contact · {contactSubjectLabel(data.subject)}
              </p>
              <p className="mt-1 truncate font-display text-xl font-semibold text-foreground">{data.name}</p>
              <p className="mt-0.5 flex items-center gap-1.5 text-sm text-muted">
                <a href={`mailto:${data.email}`} className="truncate text-sky-300 hover:underline">
                  {data.email}
                </a>
                <button
                  type="button"
                  onClick={copyEmail}
                  className="rounded p-0.5 hover:text-foreground"
                  aria-label="Copy email"
                >
                  <Copy className="h-3.5 w-3.5" />
                </button>
              </p>
              <div className="mt-2 flex items-center gap-2">
                <StatusBadge status={data.status} />
                <span className="text-xs text-muted">Received {formatDate(data.createdAt)}</span>
              </div>
            </div>
          ) : (
            <div />
          )}
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-foreground"
            aria-label="Close"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 space-y-5 overflow-y-auto p-5">
          {isLoading ? (
            <LoadingSkeleton rows={5} />
          ) : error ? (
            <p className="text-sm text-red-300">{getErrorMessage(error)}</p>
          ) : data ? (
            <>
              <div className="whitespace-pre-wrap break-words rounded-lg border border-border bg-surface p-4 text-sm leading-relaxed text-foreground">
                {data.message}
              </div>

              <div className="grid gap-3 text-xs text-muted sm:grid-cols-2">
                <p>Read: {data.readAt ? formatDate(data.readAt) : '—'}</p>
                <p>Replied: {data.repliedAt ? formatDate(data.repliedAt) : '—'}</p>
                <p>Closed: {data.closedAt ? formatDate(data.closedAt) : '—'}</p>
                <p>Last handled by: {data.handledBy?.name || data.handledBy?.email || '—'}</p>
                <p className="sm:col-span-2 break-all">IP: {data.ipAddress || '—'}</p>
                <p className="sm:col-span-2 break-all">Device: {data.userAgent || '—'}</p>
              </div>

              <label className="block">
                <span className="mb-1.5 block text-sm font-medium text-foreground">
                  Internal notes <span className="font-normal text-muted">(staff only)</span>
                </span>
                <textarea
                  value={notes}
                  onChange={(e) => setNotesDraft(e.target.value)}
                  rows={3}
                  maxLength={2000}
                  disabled={!canManage}
                  placeholder={canManage ? 'e.g. Replied from support@ on…' : 'No notes'}
                  className={inputClass}
                />
              </label>
              {canManage && notesDirty ? (
                <div className="flex justify-end">
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ adminNotes: notesDraft })}
                    className="brand-gradient-bg rounded-lg px-3 py-1.5 text-sm font-medium text-white disabled:opacity-50"
                  >
                    Save notes
                  </button>
                </div>
              ) : null}
            </>
          ) : null}
        </div>

        {data ? (
          <div className="flex flex-wrap items-center justify-between gap-2 border-t border-border p-4">
            <a
              href={buildReplyMailto(data)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-foreground hover:bg-white/5"
            >
              <Mail className="h-4 w-4" /> Reply by email
            </a>
            {canManage ? (
              <div className="flex flex-wrap gap-2">
                {data.status !== 'REPLIED' ? (
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ status: 'REPLIED' })}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-500/90 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-500 disabled:opacity-50"
                  >
                    <CheckCheck className="h-4 w-4" /> Mark replied
                  </button>
                ) : null}
                {data.status !== 'CLOSED' ? (
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ status: 'CLOSED' })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground disabled:opacity-50"
                  >
                    <XCircle className="h-4 w-4" /> Close
                  </button>
                ) : (
                  <button
                    type="button"
                    disabled={mutation.isPending}
                    onClick={() => mutation.mutate({ status: 'READ' })}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground disabled:opacity-50"
                  >
                    <RotateCcw className="h-4 w-4" /> Reopen
                  </button>
                )}
              </div>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
