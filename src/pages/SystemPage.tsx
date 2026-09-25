import { useQuery } from '@tanstack/react-query';
import { getSystemHealth } from '../api/system';
import { PageHeader } from '../components/PageHeader';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatDate, getErrorMessage } from '../lib/utils';

function statusOf(value: unknown): string {
  if (typeof value === 'string') return value;
  if (typeof value === 'object' && value && 'status' in value) {
    return String((value as { status: string }).status);
  }
  return 'unknown';
}

export function SystemPage() {
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ['system-health'],
    queryFn: getSystemHealth,
    refetchInterval: 30_000,
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (error) return <p className="text-sm text-[var(--danger)]">{getErrorMessage(error)}</p>;

  const checks = [
    { label: 'API', value: data?.api },
    { label: 'MongoDB', value: data?.mongodb },
    { label: 'R2 storage', value: data?.r2 },
    { label: 'Redis', value: data?.redis },
    { label: 'Group bot', value: (data?.telegram as Record<string, unknown> | undefined)?.groupBot },
    { label: 'MP2MP bot', value: (data?.telegram as Record<string, unknown> | undefined)?.mp2mpBot },
  ];

  return (
    <div>
      <PageHeader
        title="System Health"
        description="Infrastructure checks and runtime info"
        actions={
          <button
            type="button"
            onClick={() => void refetch()}
            className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5"
          >
            {isFetching ? 'Refreshing…' : 'Refresh'}
          </button>
        }
      />

      <div className="mb-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {checks.map((c) => (
          <div key={c.label} className="rounded-xl border border-border bg-surface p-4">
            <div className="mb-2 flex items-center justify-between">
              <p className="font-medium">{c.label}</p>
              <StatusBadge status={statusOf(c.value)} />
            </div>
            <pre className="overflow-x-auto text-xs text-muted">
              {JSON.stringify(c.value ?? {}, null, 2)}
            </pre>
          </div>
        ))}
      </div>

      <section className="rounded-xl border border-border bg-surface p-4 text-sm">
        <h2 className="mb-3 font-display font-semibold">Runtime</h2>
        <dl className="grid gap-2 sm:grid-cols-2">
          <div className="flex justify-between gap-4">
            <dt className="text-muted">App version</dt>
            <dd>{String(data?.appVersion || '—')}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Node</dt>
            <dd>{String(data?.nodeVersion || '—')}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Uptime</dt>
            <dd>
              {data?.uptimeSeconds != null
                ? `${Math.floor(Number(data.uptimeSeconds) / 3600)}h ${Math.floor((Number(data.uptimeSeconds) % 3600) / 60)}m`
                : '—'}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted">Server time</dt>
            <dd>{formatDate(String(data?.serverTime || ''))}</dd>
          </div>
        </dl>
      </section>
    </div>
  );
}
