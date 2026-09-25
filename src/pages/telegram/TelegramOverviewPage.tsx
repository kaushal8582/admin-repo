import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getTelegramOverview } from '../../api/telegram';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { formatNumber, getErrorMessage } from '../../lib/utils';

export function TelegramOverviewPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ['telegram-overview'],
    queryFn: getTelegramOverview,
  });

  if (isLoading) return <LoadingSkeleton rows={4} />;
  if (error) return <p className="text-sm text-[var(--danger)]">{getErrorMessage(error)}</p>;

  const destinations = (data?.destinations || {}) as {
    groups?: { active?: number; inactive?: number };
    channels?: { active?: number; inactive?: number };
  };
  const bots = (data?.bots || {}) as Record<
    string,
    { enabled?: boolean; running?: boolean; username?: string | null }
  >;
  const botEntries = [
    { key: 'group', label: 'Group bot', info: bots.group },
    { key: 'mp2mp', label: 'MP2MP bot', info: bots.mp2mp },
  ];

  return (
    <div>
      <PageHeader
        title="Telegram"
        description="Bot status and destination overview"
        actions={
          <div className="flex flex-wrap gap-2">
            <Link to="/telegram/users" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5">
              Connected users
            </Link>
            <Link to="/telegram/groups" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5">
              Groups
            </Link>
            <Link to="/telegram/channels" className="rounded-lg border border-border px-3 py-2 text-sm hover:bg-white/5">
              Channels
            </Link>
          </div>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Connected users" value={formatNumber(Number(data?.connectedUsers ?? 0))} />
        <StatCard
          label="Active groups"
          value={formatNumber(destinations.groups?.active ?? 0)}
          hint={`${destinations.groups?.inactive ?? 0} inactive`}
        />
        <StatCard
          label="Active channels"
          value={formatNumber(destinations.channels?.active ?? 0)}
          hint={`${destinations.channels?.inactive ?? 0} inactive`}
        />
        <StatCard
          label="Bots"
          value={`${botEntries.filter((b) => b.info?.running).length} running`}
        />
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-display font-semibold">Bot status</h2>
        <div className="grid gap-3 sm:grid-cols-2">
          {botEntries.map(({ key, label, info }) => (
            <div key={key} className="rounded-lg border border-border bg-background p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="font-medium">{label}</p>
                <StatusBadge status={info?.running ? 'ok' : 'inactive'} />
              </div>
              <p className="text-sm text-muted">
                Enabled: {info?.enabled ? 'yes' : 'no'} · Running: {info?.running ? 'yes' : 'no'}
                {info?.username ? ` · @${info.username}` : ''}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
