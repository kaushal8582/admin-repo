import { useCallback, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ImageIcon } from 'lucide-react';
import { listWithdrawals } from '../api/withdrawals';
import { PageHeader } from '../components/PageHeader';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { RowActionsMenu } from '../components/RowActionsMenu';
import { WithdrawalActionDialog } from '../components/withdrawals/WithdrawalActionDialog';
import { WithdrawalDetailModal } from '../components/withdrawals/WithdrawalDetailModal';
import {
  WITHDRAWAL_STATUSES,
  buildWithdrawalActions,
  withdrawalStatusLabel,
  type WithdrawalDialogTarget,
} from '../components/withdrawals/withdrawalStatus';
import { useAuth } from '../auth/AuthContext';
import type { WithdrawalItem } from '../types';
import { formatDate, formatUsd } from '../lib/utils';

export function WithdrawalsPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('withdrawals:manage');
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState('');
  const [search, setSearch] = useState('');
  const [detailId, setDetailId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<WithdrawalDialogTarget | null>(null);

  const closeDetail = useCallback(() => setDetailId(null), []);
  const closeDialog = useCallback(() => setDialog(null), []);

  const { data, isLoading } = useQuery({
    queryKey: ['withdrawals', page, statusFilter, search],
    queryFn: () =>
      listWithdrawals({
        page,
        limit: 25,
        status: statusFilter || undefined,
        search: search || undefined,
      }),
  });

  const columns: DataTableColumn<WithdrawalItem>[] = [
    {
      key: 'reference',
      header: 'Payment ID',
      render: (row) => (
        <span className="whitespace-nowrap font-mono text-xs font-medium text-foreground">
          {row.reference || '—'}
        </span>
      ),
    },
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <div>
          <p className="text-sm font-medium">{row.user?.email || '—'}</p>
          <p className="text-xs uppercase text-muted">{row.method}</p>
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
        <div className="text-xs text-muted">
          <p>
            {row.paymentSnapshot?.upiId ||
              row.paymentSnapshot?.accountNumber ||
              row.paymentSnapshot?.accountName ||
              '—'}
          </p>
          {row.transactionId ? (
            <p className="mt-0.5 inline-flex items-center gap-1 font-mono text-foreground">
              {row.transactionId}
              {row.hasPaymentProof ? <ImageIcon className="h-3 w-3 text-muted" /> : null}
            </p>
          ) : null}
        </div>
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
        onRowClick={(row) => setDetailId(row.id)}
        search={search}
        searchPlaceholder="Search payment ID or transaction ID…"
        onSearchChange={(value) => {
          setSearch(value.trim());
          setPage(1);
        }}
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
            <option value="open">Open (not closed)</option>
            {WITHDRAWAL_STATUSES.map((s) => (
              <option key={s} value={s}>
                {withdrawalStatusLabel(s)}
              </option>
            ))}
          </select>
        }
        rowActions={(row) => (
          <RowActionsMenu
            items={buildWithdrawalActions(row, {
              canManage,
              onView: () => setDetailId(row.id),
              onDialog: setDialog,
            })}
          />
        )}
      />

      <WithdrawalDetailModal
        payoutId={detailId}
        canManage={canManage}
        onClose={closeDetail}
        onDialog={setDialog}
        escapeDisabled={Boolean(dialog)}
      />
      <WithdrawalActionDialog target={dialog} onClose={closeDialog} />
    </div>
  );
}
