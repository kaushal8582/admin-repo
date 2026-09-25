import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { listAuditLogs } from '../api/audit';
import { PageHeader } from '../components/PageHeader';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import type { AuditLogItem } from '../types';
import { formatDate } from '../lib/utils';

export function AuditLogsPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['audit-logs', page, search],
    queryFn: () => listAuditLogs({ page, limit: 25, search: search || undefined }),
  });

  const columns: DataTableColumn<AuditLogItem>[] = [
    {
      key: 'action',
      header: 'Action',
      render: (row) => (
        <div>
          <p className="font-medium">{row.action}</p>
          <p className="text-xs text-muted">
            {row.targetType}
            {row.targetId ? ` · ${row.targetId}` : ''}
          </p>
        </div>
      ),
    },
    {
      key: 'admin',
      header: 'Admin',
      render: (row) => {
        const admin = row.adminId;
        if (admin && typeof admin === 'object') {
          return <span className="text-sm">{admin.email || admin.name || admin.id}</span>;
        }
        return <span className="font-mono text-xs">{String(admin || '—')}</span>;
      },
    },
    {
      key: 'ip',
      header: 'IP',
      render: (row) => <span className="text-xs text-muted">{row.ipAddress || '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'When',
      render: (row) => <span className="text-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Audit Logs" description="Immutable record of admin actions" />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        total={data?.pagination.total}
        page={page}
        pageSize={25}
        search={search}
        searchPlaceholder="Search action or target…"
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
