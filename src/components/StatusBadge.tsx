import { cn } from '../lib/utils';

const STATUS_STYLES: Record<string, string> = {
  active: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  paid: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  resolved: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  action_taken: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  ok: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  connected: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',

  pending: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  under_review: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  processing: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  approved: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  new: 'bg-sky-500/15 text-sky-300 border-sky-500/30',
  read: 'bg-amber-500/15 text-amber-300 border-amber-500/30',
  replied: 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30',
  closed: 'bg-slate-500/15 text-slate-300 border-slate-500/30',

  banned: 'bg-red-500/15 text-red-300 border-red-500/30',
  suspended: 'bg-red-500/15 text-red-300 border-red-500/30',
  rejected: 'bg-red-500/15 text-red-300 border-red-500/30',
  cancelled: 'bg-red-500/15 text-red-300 border-red-500/30',
  disabled: 'bg-red-500/15 text-red-300 border-red-500/30',
  failed: 'bg-red-500/15 text-red-300 border-red-500/30',
  error: 'bg-red-500/15 text-red-300 border-red-500/30',

  inactive: 'bg-slate-500/15 text-slate-300 border-slate-500/30',
};

interface StatusBadgeProps {
  status?: string | null;
  className?: string;
}

export function StatusBadge({ status, className }: StatusBadgeProps) {
  const raw = status || 'unknown';
  const key = raw.toLowerCase();
  const style = STATUS_STYLES[key] || 'bg-slate-500/15 text-slate-300 border-slate-500/30';

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-md border px-2 py-0.5 text-xs font-medium capitalize',
        style,
        className
      )}
    >
      {raw.replace(/_/g, ' ').toLowerCase()}
    </span>
  );
}
