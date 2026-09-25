import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getOgEarnOverview, listOgLinks } from '../api/ogEarn';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import type { OgLinkItem } from '../types';
import { formatDate, formatNumber, formatUsd, getErrorMessage } from '../lib/utils';

export function OgEarnPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['og-earn-overview'],
    queryFn: getOgEarnOverview,
  });

  const linksQuery = useQuery({
    queryKey: ['og-earn-links', page, search],
    queryFn: () => listOgLinks({ page, limit: 25, search: search || undefined }),
  });

  const overview = overviewQuery.data || {};
  const links = (overview.links || {}) as Record<string, number>;
  const events = (overview.events || {}) as Record<string, number>;

  const columns: DataTableColumn<OgLinkItem>[] = [
    {
      key: 'shareToken',
      header: 'Link',
      render: (row) => (
        <div>
          <p className="font-mono text-xs">{row.shareToken}</p>
          <p className="text-xs text-muted">{row.video?.title || '—'}</p>
        </div>
      ),
    },
    {
      key: 'owner',
      header: 'Owner',
      render: (row) => <span className="text-sm">{row.owner?.email || '—'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'viewCount',
      header: 'Views',
      render: (row) => formatNumber(row.viewCount),
    },
    {
      key: 'payableViewCount',
      header: 'Payable',
      render: (row) => formatNumber(row.payableViewCount),
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => <span className="text-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="OG Earn" description="Share-link monetization overview" />

      {overviewQuery.isLoading ? (
        <LoadingSkeleton rows={2} className="mb-6" />
      ) : overviewQuery.error ? (
        <p className="mb-6 text-sm text-[var(--danger)]">{getErrorMessage(overviewQuery.error)}</p>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard
            label="Links"
            value={formatNumber(links.total)}
            hint={`${formatNumber(links.active)} active`}
          />
          <StatCard label="Views" value={formatNumber(links.views)} />
          <StatCard label="Events" value={formatNumber(events.total)} />
          <StatCard label="Gross USD" value={formatUsd(events.grossUsd)} />
        </div>
      )}

      <DataTable
        columns={columns}
        data={linksQuery.data?.data ?? []}
        loading={linksQuery.isLoading}
        total={linksQuery.data?.pagination.total}
        page={page}
        pageSize={25}
        search={search}
        rowKey={(r) => r.id}
        onPageChange={setPage}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
      />
    </div>
  );
}
