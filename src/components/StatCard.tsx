import type { ReactNode } from 'react';
import { cn } from '../lib/utils';

interface StatCardProps {
  label: string;
  value: string | number;
  hint?: string;
  icon?: ReactNode;
  className?: string;
}

export function StatCard({ label, value, hint, icon, className }: StatCardProps) {
  return (
    <div
      className={cn(
        'rounded-xl border border-border bg-surface p-4 shadow-sm',
        className
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-muted">{label}</p>
          <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
          {hint ? <p className="mt-1 text-xs text-muted">{hint}</p> : null}
        </div>
        {icon ? (
          <div className="rounded-lg bg-[var(--accent-soft)] p-2 text-primary">{icon}</div>
        ) : null}
      </div>
    </div>
  );
}
