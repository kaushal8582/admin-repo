import { useEffect, useId, useState, type FormEvent } from 'react';
import { X } from 'lucide-react';

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  danger?: boolean;
  requireReason?: boolean;
  reasonLabel?: string;
  reasonPlaceholder?: string;
  loading?: boolean;
  onConfirm: (reason: string) => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  danger = false,
  requireReason = false,
  reasonLabel = 'Reason',
  reasonPlaceholder = 'Enter a reason…',
  loading = false,
  onConfirm,
  onClose,
}: ConfirmDialogProps) {
  const [reason, setReason] = useState('');
  const titleId = useId();

  useEffect(() => {
    if (open) setReason('');
  }, [open]);

  if (!open) return null;

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    if (requireReason && reason.trim().length < 3) return;
    await onConfirm(reason.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/60"
        aria-label="Close dialog"
        onClick={onClose}
      />
      <form
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        onSubmit={handleSubmit}
        className="relative w-full max-w-md rounded-xl border border-border bg-surface-elevated p-5 shadow-xl"
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h2 id={titleId} className="font-display text-lg font-semibold text-foreground">
              {title}
            </h2>
            {description ? <p className="mt-1 text-sm text-muted">{description}</p> : null}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-md p-1 text-muted hover:bg-white/5 hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {(requireReason || reasonLabel) && (
          <label className="mb-4 block">
            <span className="mb-1.5 block text-sm font-medium text-foreground">
              {reasonLabel}
              {requireReason ? ' *' : ' (optional)'}
            </span>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={reasonPlaceholder}
              className="w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm text-foreground outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--input-focus-ring)]"
              required={requireReason}
              minLength={requireReason ? 3 : undefined}
            />
          </label>
        )}

        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-lg border border-border px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-foreground"
          >
            {cancelLabel}
          </button>
          <button
            type="submit"
            disabled={loading || (requireReason && reason.trim().length < 3)}
            className={
              danger
                ? 'rounded-lg bg-red-500/90 px-3 py-2 text-sm font-medium text-white hover:bg-red-500 disabled:opacity-50'
                : 'brand-gradient-bg rounded-lg px-3 py-2 text-sm font-medium text-white disabled:opacity-50'
            }
          >
            {loading ? 'Working…' : confirmLabel}
          </button>
        </div>
      </form>
    </div>
  );
}
