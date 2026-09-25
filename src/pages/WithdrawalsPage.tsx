import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { listWithdrawals, updateWithdrawalStatus } from '../api/withdrawals';
import { PageHeader } from '../components/PageHeader';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../auth/AuthContext';
import type { WithdrawalItem } from '../types';
import { formatDate, formatUsd, getErrorMessage } from '../lib/utils';

const NEXT: Record<string, string[]> = {
  pending: ['under_review', 'approved', 'rejected', 'cancelled', 'paid'],
  under_review: ['approved', 'rejected', 'cancelled'],
  approved: ['processing', 'rejected'],
  processing: ['paid', 'rejected'],
};

export function WithdrawalsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [confirm, setConfirm] = useState<{ item: WithdrawalItem; status: string } | null>(null);

  const { data, isLoading } = useQuery({
    queryKey: ['withdrawals', page, statusFilter],
    queryFn: () =>
      listWithdrawals({
        page,
        limit: 25,
        status: statusFilter || undefined,
      }),
  });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      status,
      reason,
    }: {
      id: string;
      status: string;
      reason: string;
    }) =>
      updateWithdrawalStatus(id, {
        status,
        reason: reason || undefined,
        note: reason || undefined,
      }),
    onSuccess: () => {
      toast.success('Withdrawal updated');
      setConfirm(null);
      void qc.invalidateQueries({ queryKey: ['withdrawals'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: DataTableColumn<WithdrawalItem>[] = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.user?.email || '—'}</p>
          <p className="text-xs text-muted">{row.method}</p>
        </div>
      ),
    },
    {
      key: 'amountUsd',
      header: 'Amount',
      render: (row) => formatUsd(row.amountUsd),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'payment',
      header: 'Payment',
      render: (row) => (
        <span className="text-xs text-muted">
          {row.paymentSnapshot?.upiId ||
            row.paymentSnapshot?.accountNumber ||
            row.paymentSnapshot?.accountName ||
            '—'}
        </span>
      ),
    },
    {
      key: 'createdAt',
      header: 'Requested',
      render: (row) => <span className="text-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Withdrawals" description="Review and process payout requests" />
      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        total={data?.pagination.total}
        page={page}
        pageSize={25}
        rowKey={(r) => r.id}
        onPageChange={setPage}
        toolbar={
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none"
          >
            <option value="">All statuses</option>
            {['pending', 'under_review', 'approved', 'processing', 'paid', 'rejected', 'cancelled'].map(
              (s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              )
            )}
          </select>
        }
        rowActions={(row) =>
          hasPermission('withdrawals:manage')
            ? (NEXT[row.status || ''] || []).map((s) => (
                <button
                  key={s}
                  type="button"
                  className="rounded-md border border-border px-2 py-1 text-xs capitalize text-muted hover:bg-white/5 hover:text-foreground"
                  onClick={() => setConfirm({ item: row, status: s })}
                >
                  {s.replace(/_/g, ' ')}
                </button>
              ))
            : null
        }
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={`Mark as ${confirm?.status?.replace(/_/g, ' ')}`}
        description={
          confirm
            ? `Update withdrawal ${formatUsd(confirm.item.amountUsd)} for ${confirm.item.user?.email || 'user'}`
            : undefined
        }
        requireReason={confirm?.status === 'rejected' || confirm?.status === 'cancelled'}
        danger={confirm?.status === 'rejected' || confirm?.status === 'cancelled'}
        confirmLabel="Update"
        loading={mutation.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={async (reason) => {
          if (!confirm) return;
          await mutation.mutateAsync({
            id: confirm.item.id,
            status: confirm.status,
            reason,
          });
        }}
      />
    </div>
  );
}
