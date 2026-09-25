import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Eye } from 'lucide-react';
import { listReports } from '../../api/reports';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import type { ReportItem } from '../../types';
import { formatDate } from '../../lib/utils';

const STATUS_FILTERS = ['', 'PENDING', 'UNDER_REVIEW', 'ACTION_TAKEN', 'REJECTED', 'RESOLVED'];

export function ReportsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const { data, isLoading } = useQuery({
    queryKey: ['reports', page, search, status, sortBy, sortOrder],
    queryFn: () =>
      listReports({
        page,
        limit: 25,
        search: search || undefined,
        status: status || undefined,
        sortBy,
        sortOrder,
      }),
  });

  const columns: DataTableColumn<ReportItem>[] = [
    {
      key: 'reason',
      header: 'Report',
      render: (row) => (
        <div>
          <Link to={`/reports/${row.id}`} className="font-medium hover:text-primary">
            {row.reason || 'Report'}
          </Link>
          <p className="line-clamp-1 text-xs text-muted">{row.description || row.reportedUrl}</p>
        </div>
      ),
    },
    {
      key: 'video',
      header: 'Video',
      render: (row) =>
        row.video?.id ? (
          <Link to={`/videos/${row.video.id}`} className="text-sm text-primary hover:underline">
            {row.video.title || row.video.id}
          </Link>
        ) : (
          '—'
        ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'reporter',
      header: 'Reporter',
      render: (row) => <span className="text-sm text-muted">{row.reporterEmail || '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'Created',
      sortable: true,
      render: (row) => <span className="text-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Reports" description="Content report queue" />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        total={data?.pagination.total}
        page={page}
        pageSize={25}
        search={search}
        sortBy={sortBy}
        sortOrder={sortOrder}
        rowKey={(r) => r.id}
        onPageChange={setPage}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        onSortChange={(by, order) => {
          setSortBy(by);
          setSortOrder(order);
          setPage(1);
        }}
        toolbar={
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s || 'all'} value={s}>
                {s || 'All statuses'}
              </option>
            ))}
          </select>
        }
        rowActions={(row) => (
          <Link
            to={`/reports/${row.id}`}
            className="rounded-md border border-border p-1.5 text-muted hover:text-foreground"
          >
            <Eye className="h-4 w-4" />
          </Link>
        )}
      />
    </div>
  );
}
