import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Users, Video, Flag, Banknote, HardDrive, Eye } from 'lucide-react';
import { getDashboard } from '../api/dashboard';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatBytes, formatNumber, getErrorMessage } from '../lib/utils';

const RANGES = [
  { value: '7d', label: '7 days' },
  { value: '30d', label: '30 days' },
  { value: '90d', label: '90 days' },
];

export function DashboardPage() {
  const [range, setRange] = useState('30d');
  const { data, isLoading, error } = useQuery({
    queryKey: ['dashboard', range],
    queryFn: () => getDashboard(range),
  });

  const chartData =
    data?.series.users.map((u, i) => ({
      date: u.date.slice(5),
      users: u.count,
      videos: data.series.videos[i]?.count ?? 0,
      ogEvents: data.series.ogEarnEvents[i]?.count ?? 0,
    })) ?? [];

  return (
    <div>
      <PageHeader
        title="Dashboard"
        description="Platform overview and recent trends"
        actions={
          <div className="flex gap-1 rounded-lg border border-border p-1">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                onClick={() => setRange(r.value)}
                className={
                  range === r.value
                    ? 'rounded-md bg-[var(--accent-soft)] px-3 py-1.5 text-xs font-medium text-primary'
                    : 'rounded-md px-3 py-1.5 text-xs text-muted hover:text-foreground'
                }
              >
                {r.label}
              </button>
            ))}
          </div>
        }
      />

      {isLoading ? (
        <LoadingSkeleton rows={4} />
      ) : error ? (
        <p className="text-sm text-[var(--danger)]">{getErrorMessage(error)}</p>
      ) : data ? (
        <>
          <div className="mb-6 grid gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
            <StatCard
              label="Users"
              value={formatNumber(data.totals.users)}
              hint={`+${data.totals.newUsersToday} today`}
              icon={<Users className="h-5 w-5" />}
            />
            <StatCard
              label="Videos"
              value={formatNumber(data.totals.videos)}
              hint={`+${data.totals.uploadsToday} today`}
              icon={<Video className="h-5 w-5" />}
            />
            <StatCard
              label="Views"
              value={formatNumber(data.totals.totalViews)}
              icon={<Eye className="h-5 w-5" />}
            />
            <StatCard
              label="Storage"
              value={formatBytes(data.totals.storageBytes)}
              icon={<HardDrive className="h-5 w-5" />}
            />
            <StatCard
              label="Pending reports"
              value={formatNumber(data.totals.pendingReports)}
              icon={<Flag className="h-5 w-5" />}
            />
            <StatCard
              label="Pending payouts"
              value={formatNumber(data.totals.pendingPayouts)}
              icon={<Banknote className="h-5 w-5" />}
            />
          </div>

          {chartData.length > 0 ? (
            <div className="rounded-xl border border-border bg-surface p-4">
              <h2 className="mb-4 font-display text-base font-semibold">Trends ({range})</h2>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData}>
                    <CartesianGrid stroke="rgba(255,255,255,0.06)" vertical={false} />
                    <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                    <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} allowDecimals={false} />
                    <Tooltip
                      contentStyle={{
                        background: '#121a2e',
                        border: '1px solid rgba(255,255,255,0.08)',
                        borderRadius: 8,
                      }}
                    />
                    <Legend />
                    <Line type="monotone" dataKey="users" stroke="#00d2ff" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="videos" stroke="#3a7bd5" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="ogEvents" stroke="#8e2de2" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </div>
  );
}
