import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getStorageOverview, listStorageFiles } from '../api/storage';
import { PageHeader } from '../components/PageHeader';
import { StatCard } from '../components/StatCard';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { formatBytes, formatDate, formatNumber, getErrorMessage } from '../lib/utils';

type FileRow = Record<string, unknown>;

export function StoragePage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const overviewQuery = useQuery({
    queryKey: ['storage-overview'],
    queryFn: getStorageOverview,
  });

  const filesQuery = useQuery({
    queryKey: ['storage-files', page, search],
    queryFn: () => listStorageFiles({ page, limit: 25, search: search || undefined }),
  });

  const overview = overviewQuery.data || {};

  const columns: DataTableColumn<FileRow>[] = [
    {
      key: 'title',
      header: 'File',
      render: (row) => (
        <div>
          <p className="font-medium">{String(row.title || row.originalName || '—')}</p>
          <p className="text-xs text-muted">
            {(row.owner as { email?: string } | undefined)?.email || '—'}
          </p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={String(row.status || '')} />,
    },
    {
      key: 'size',
      header: 'Size',
      render: (row) => formatBytes(Number(row.size || 0)),
    },
    {
      key: 'createdAt',
      header: 'Uploaded',
      render: (row) => <span className="text-muted">{formatDate(String(row.createdAt || ''))}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Storage" description="Object storage usage and files" />

      {overviewQuery.isLoading ? (
        <LoadingSkeleton rows={2} className="mb-6" />
      ) : overviewQuery.error ? (
        <p className="mb-6 text-sm text-[var(--danger)]">{getErrorMessage(overviewQuery.error)}</p>
      ) : (
        <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatCard label="Total size" value={formatBytes(Number(overview.totalBytes || 0))} />
          <StatCard label="Total files" value={formatNumber(Number(overview.totalFiles || 0))} />
          <StatCard label="Uploads today" value={formatNumber(Number(overview.uploadsToday || 0))} />
          <StatCard label="Failed" value={formatNumber(Number(overview.failedCount || 0))} />
        </div>
      )}

      <DataTable
        columns={columns}
        data={(filesQuery.data?.data as FileRow[]) ?? []}
        loading={filesQuery.isLoading}
        total={filesQuery.data?.pagination.total}
        page={page}
        pageSize={25}
        search={search}
        rowKey={(r) => String(r.id || r._id)}
        onPageChange={setPage}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
      />
    </div>
  );
}
