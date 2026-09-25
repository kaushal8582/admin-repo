import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { disableDestination, listTelegramChannels } from '../../api/telegram';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../auth/AuthContext';
import { formatDate, getErrorMessage } from '../../lib/utils';

type Dest = Record<string, unknown>;

export function TelegramChannelsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [selected, setSelected] = useState<Dest | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['telegram-channels', page, search],
    queryFn: () => listTelegramChannels({ page, limit: 25, search: search || undefined }),
  });

  const mutation = useMutation({
    mutationFn: (reason: string) =>
      disableDestination(String(selected?.id || selected?._id), reason),
    onSuccess: () => {
      toast.success('Channel disabled');
      setSelected(null);
      void qc.invalidateQueries({ queryKey: ['telegram-channels'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: DataTableColumn<Dest>[] = [
    {
      key: 'title',
      header: 'Channel',
      render: (row) => (
        <div>
          <p className="font-medium">{String(row.title || row.name || '—')}</p>
          <p className="text-xs text-muted">{String(row.chatId || row.telegramChatId || '')}</p>
        </div>
      ),
    },
    {
      key: 'isActive',
      header: 'Status',
      render: (row) => <StatusBadge status={row.isActive ? 'active' : 'inactive'} />,
    },
    {
      key: 'createdAt',
      header: 'Created',
      render: (row) => <span className="text-muted">{formatDate(String(row.createdAt || ''))}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Telegram Channels" description="Connected channels" />
      <DataTable
        columns={columns}
        data={(data?.data as Dest[]) ?? []}
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
          hasPermission('telegram:manage') && row.isActive ? (
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
              onClick={() => setSelected(row)}
            >
              Disable
            </button>
          ) : null
        }
      />

      <ConfirmDialog
        open={Boolean(selected)}
        title="Disable channel destination"
        requireReason
        danger
        confirmLabel="Disable"
        loading={mutation.isPending}
        onClose={() => setSelected(null)}
        onConfirm={async (reason) => {
          await mutation.mutateAsync(reason);
        }}
      />
    </div>
  );
}
