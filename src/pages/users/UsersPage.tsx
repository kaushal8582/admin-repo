import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
import { listUsers, suspendUser, unsuspendUser } from '../../api/users';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../auth/AuthContext';
import type { PlatformUser } from '../../types';
import { formatDate, formatRole, getErrorMessage } from '../../lib/utils';

export function UsersPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirm, setConfirm] = useState<{
    user: PlatformUser;
    action: 'suspend' | 'unsuspend';
  } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['users', page, search, sortBy, sortOrder],
    queryFn: () => listUsers({ page, limit: 25, search, sortBy, sortOrder }),
  });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'suspend' | 'unsuspend';
      reason: string;
    }) => {
      if (action === 'suspend') return suspendUser(id, reason);
      return unsuspendUser(id, reason);
    },
    onSuccess: () => {
      toast.success(confirm?.action === 'suspend' ? 'User suspended' : 'User unsuspended');
      setConfirm(null);
      void qc.invalidateQueries({ queryKey: ['users'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: DataTableColumn<PlatformUser>[] = [
    {
      key: 'name',
      header: 'User',
      sortable: true,
      render: (row) => (
        <div>
          <Link to={`/users/${row.id}`} className="font-medium text-foreground hover:text-primary">
            {row.name || '—'}
          </Link>
          <p className="text-xs text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      sortable: true,
      render: (row) => <span className="text-sm">{formatRole(row.role)}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Joined',
      sortable: true,
      render: (row) => <span className="text-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Users" description="Search, inspect, and moderate platform accounts" />
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
        rowActions={(row) => (
          <>
            <Link
              to={`/users/${row.id}`}
              className="rounded-md border border-border p-1.5 text-muted hover:text-foreground"
              title="View"
            >
              <Eye className="h-4 w-4" />
            </Link>
            {row.status === 'banned' || row.status === 'suspended'
              ? hasPermission('users:unsuspend') && (
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
                    onClick={() => setConfirm({ user: row, action: 'unsuspend' })}
                  >
                    Unsuspend
                  </button>
                )
              : hasPermission('users:suspend') && (
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    onClick={() => setConfirm({ user: row, action: 'suspend' })}
                  >
                    Suspend
                  </button>
                )}
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action === 'suspend' ? 'Suspend user' : 'Unsuspend user'}
        description={
          confirm
            ? `${confirm.action === 'suspend' ? 'Suspend' : 'Unsuspend'} ${confirm.user.email}?`
            : undefined
        }
        requireReason={confirm?.action === 'suspend'}
        danger={confirm?.action === 'suspend'}
        confirmLabel={confirm?.action === 'suspend' ? 'Suspend' : 'Unsuspend'}
        loading={mutation.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={async (reason) => {
          if (!confirm) return;
          await mutation.mutateAsync({
            id: confirm.user.id,
            action: confirm.action,
            reason,
          });
        }}
      />
    </div>
  );
}
