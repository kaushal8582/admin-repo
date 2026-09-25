import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { disconnectTelegramUser, listTelegramUsers } from '../../api/telegram';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../auth/AuthContext';
import { formatDate, getErrorMessage } from '../../lib/utils';

type TgUser = Record<string, unknown>;

export function TelegramUsersPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<TgUser | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['telegram-users', page, search],
    queryFn: () => listTelegramUsers({ page, limit: 25, search: search || undefined }),
  });

  const mutation = useMutation({
    mutationFn: (reason: string) => {
      const user = selected?.user as { id?: string } | undefined;
      const userId = String(user?.id || selected?.userId || '');
      return disconnectTelegramUser(userId, reason);
    },
    onSuccess: () => {
      toast.success('Disconnected');
      setSelected(null);
      void qc.invalidateQueries({ queryKey: ['telegram-users'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: DataTableColumn<TgUser>[] = [
    {
      key: 'user',
      header: 'User',
      render: (row) => {
        const user = row.user as { email?: string; name?: string } | undefined;
        return (
          <div>
            <p className="text-sm font-medium">{user?.email || String(row.userId || '—')}</p>
            <p className="text-xs text-muted">@{String(row.telegramUsername || row.telegramUserId || '—')}</p>
          </div>
        );
      },
    },
    {
      key: 'connected',
      header: 'Status',
      render: (row) => <StatusBadge status={row.connected ? 'connected' : 'inactive'} />,
    },
    {
      key: 'connectedAt',
      header: 'Connected',
      render: (row) => (
        <span className="text-muted">{formatDate(String(row.connectedAt || ''))}</span>
      ),
    },
  ];

  return (
    <div>
      <PageHeader title="Connected Users" description="Telegram MP2MP connections" />
      <DataTable
        columns={columns}
        data={(data?.data as TgUser[]) ?? []}
        loading={isLoading}
        total={data?.pagination.total}
        page={page}
        pageSize={25}
        search={search}
        rowKey={(r) => String(r.id || r._id)}
        onPageChange={setPage}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        rowActions={(row) =>
          hasPermission('telegram:manage') && row.connected ? (
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
              onClick={() => setSelected(row)}
            >
              Disconnect
            </button>
          ) : null
        }
      />

      <ConfirmDialog
        open={Boolean(selected)}
        title="Disconnect Telegram user"
        requireReason
        danger
        confirmLabel="Disconnect"
        loading={mutation.isPending}
        onClose={() => setSelected(null)}
        onConfirm={async (reason) => {
          await mutation.mutateAsync(reason);
        }}
      />
    </div>
  );
}
