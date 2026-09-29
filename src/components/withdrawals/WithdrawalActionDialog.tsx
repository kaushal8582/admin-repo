import { useEffect, useId, useMemo, useState, type ChangeEvent, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ImagePlus, X } from 'lucide-react';
import {
  addWithdrawalNote,
  updateWithdrawalStatus,
  uploadWithdrawalProof,
} from '../../api/withdrawals';
import { formatUsd, getErrorMessage } from '../../lib/utils';
import {
  WITHDRAWAL_ACTION_LABELS,
  withdrawalStatusLabel,
  type WithdrawalDialogTarget,
} from './withdrawalStatus';

const PROOF_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const PROOF_MAX_BYTES = 5 * 1024 * 1024;

const inputClass =
  'w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--input-focus-ring)]';

interface WithdrawalActionDialogProps {
  target: WithdrawalDialogTarget | null;
  onClose: () => void;
}

export function WithdrawalActionDialog({ target, onClose }: WithdrawalActionDialogProps) {
  if (!target) return null;
  const key = `${target.mode}-${target.payout.id}-${target.mode === 'status' ? target.status : ''}`;
  return <ActionDialogBody key={key} target={target} onClose={onClose} />;
}

function ActionDialogBody({
  target,
  onClose,
}: {
  target: WithdrawalDialogTarget;
  onClose: () => void;
}) {
  const qc = useQueryClient();
  const titleId = useId();
  const [note, setNote] = useState('');
  const [internal, setInternal] = useState(false);
  const [transactionId, setTransactionId] = useState(
    target.mode === 'proof' ? target.payout.transactionId || '' : ''
  );
  const [proof, setProof] = useState<File | null>(null);
  const preview = useMemo(() => (proof ? URL.createObjectURL(proof) : null), [proof]);

  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview]
  );

  const mutation = useMutation({
    mutationFn: async () => {
      const id = target.payout.id;
      if (target.mode === 'note') {
        return addWithdrawalNote(id, { note: note.trim(), internal });
      }
      if (target.mode === 'proof') {
        return uploadWithdrawalProof(id, proof as File, transactionId.trim() || undefined);
      }
      const reasonRequired = target.status === 'rejected' || target.status === 'cancelled';
      return updateWithdrawalStatus(id, {
        status: target.status,
        note: note.trim() || undefined,
        reason: reasonRequired ? note.trim() : undefined,
        internal: reasonRequired ? false : internal,
        transactionId: target.status === 'paid' ? transactionId.trim() : undefined,
        proof: target.status === 'paid' ? proof : null,
      });
    },
    onSuccess: (detail) => {
      toast.success(
        target.mode === 'note'
          ? 'Note added'
          : target.mode === 'proof'
            ? 'Payment proof uploaded'
            : 'Withdrawal updated'
      );
      qc.setQueryData(['withdrawal', detail.id], detail);
      void qc.invalidateQueries({ queryKey: ['withdrawals'] });
      onClose();
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const { payout } = target;
  const status = target.mode === 'status' ? target.status : null;
  const isPaid = status === 'paid';
  const reasonRequired = status === 'rejected' || status === 'cancelled';
  const noteRequired = target.mode === 'note' || reasonRequired;
  const showProof = isPaid || target.mode === 'proof';
  const showTxn = isPaid || target.mode === 'proof';
  const showNote = target.mode !== 'proof';
  const showInternal = showNote && !reasonRequired;
  const danger = reasonRequired;

  const title =
    target.mode === 'note'
      ? 'Add note'
      : target.mode === 'proof'
        ? payout.hasPaymentProof
          ? 'Replace payment proof'
          : 'Upload payment proof'
        : WITHDRAWAL_ACTION_LABELS[status as string] || `Mark as ${withdrawalStatusLabel(status)}`;

  const canSubmit =
    !mutation.isPending &&
    (!noteRequired || note.trim().length >= (reasonRequired ? 3 : 1)) &&
    (!isPaid || transactionId.trim().length > 0) &&
    (target.mode !== 'proof' || Boolean(proof));

  const onFile = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    e.target.value = '';
    if (!file) return;
    if (!PROOF_TYPES.includes(file.type)) {
      toast.error('Use a JPG, PNG, or WebP image.');
      return;
    }
    if (file.size > PROOF_MAX_BYTES) {
      toast.error('Image must be 5 MB or smaller.');
      return;
    }
    setProof(file);
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (canSubmit) mutation.mutate();
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={mutation.isPending ? undefined : onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="relative max-h-[90vh] w-full max-w-md overflow-y-auto rounded-xl border border-border bg-surface-elevated p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
              {title}
            </h2>
            <p className="mt-1 text-sm text-muted">
              {formatUsd(payout.amountUsd)} · {payout.user?.email || 'user'} ·{' '}
              {withdrawalStatusLabel(payout.status)}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="space-y-4">
          {showTxn ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Transaction ID{isPaid ? ' *' : ' (optional)'}
              </span>
              <input
                value={transactionId}
                onChange={(e) => setTransactionId(e.target.value)}
                maxLength={120}
                placeholder="UTR / bank reference"
                className={`${inputClass} font-mono`}
                required={isPaid}
                autoFocus
              />
            </label>
          ) : null}

          {showProof ? (
            <div>
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                Payment screenshot{target.mode === 'proof' ? ' *' : ' (optional)'}
              </span>
              {preview ? (
                <div className="relative overflow-hidden rounded-lg border border-border">
                  <img src={preview} alt="Payment proof preview" className="max-h-56 w-full object-contain bg-surface" />
                  <button
                    type="button"
                    onClick={() => setProof(null)}
                    className="absolute right-2 top-2 rounded-md bg-black/60 p-1 text-white hover:bg-black/80"
                    aria-label="Remove image"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ) : (
                <label className="flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border px-4 py-6 text-sm text-muted hover:bg-white/5 hover:text-foreground">
                  <ImagePlus className="h-5 w-5" />
                  <span>Click to choose an image</span>
                  <span className="text-xs">JPG, PNG, or WebP · up to 5 MB</span>
                  <input type="file" accept={PROOF_TYPES.join(',')} className="hidden" onChange={onFile} />
                </label>
              )}
            </div>
          ) : null}

          {showNote ? (
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium text-foreground">
                {reasonRequired ? 'Reason' : 'Note'}
                {noteRequired ? ' *' : ' (optional)'}
              </span>
              <textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                maxLength={reasonRequired ? 1000 : 500}
                placeholder={
                  reasonRequired ? 'Shown to the creator…' : 'Add context for this update…'
                }
                className={inputClass}
                required={noteRequired}
                autoFocus={!showTxn}
              />
            </label>
          ) : null}

          {showInternal ? (
            <label className="flex items-start gap-2 text-sm text-muted">
              <input
                type="checkbox"
                checked={internal}
                onChange={(e) => setInternal(e.target.checked)}
                className="mt-0.5"
              />
              <span>
                Internal only
                <span className="block text-xs">Hidden from the creator; visible to admins.</span>
              </span>
            </label>
          ) : reasonRequired ? (
            <p className="text-xs text-muted">The reason is always visible to the creator.</p>
          ) : null}
        </div>

        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={mutation.isPending}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={!canSubmit}
            className={
              danger
                ? 'rounded-lg bg-red-500/90 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50'
                : 'brand-gradient-bg rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50'
            }
          >
            {mutation.isPending ? 'Saving…' : target.mode === 'note' ? 'Add note' : 'Confirm'}
          </button>
        </div>
      </form>
    </div>
  );
}
