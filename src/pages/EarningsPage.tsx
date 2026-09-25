import { useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { adjustEarnings, listEarnings } from '../api/earnings';
import { PageHeader } from '../components/PageHeader';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { useAuth } from '../auth/AuthContext';
import type { LedgerItem } from '../types';
import { formatDate, formatUsd, getErrorMessage } from '../lib/utils';

export function EarningsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [userId, setUserId] = useState('');
  const [amount, setAmount] = useState('');
  const [reason, setReason] = useState('');
  const [balanceField, setBalanceField] = useState('manualAdjustmentUsd');

  const { data, isLoading } = useQuery({
    queryKey: ['earnings', page, search],
    queryFn: () => listEarnings({ page, limit: 25, search: search || undefined }),
  });

  const mutation = useMutation({
    mutationFn: () =>
      adjustEarnings({
        userId: userId.trim(),
        amount: Number(amount),
        reason: reason.trim(),
        balanceField,
      }),
    onSuccess: () => {
      toast.success('Adjustment applied');
      setAmount('');
      setReason('');
      void qc.invalidateQueries({ queryKey: ['earnings'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const onAdjust = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  const columns: DataTableColumn<LedgerItem>[] = [
    {
      key: 'user',
      header: 'User',
      render: (row) => (
        <div>
          <p className="text-sm">{row.user?.email || row.userId}</p>
          <p className="text-xs text-muted">{row.type}</p>
        </div>
      ),
    },
    {
      key: 'amount',
      header: 'Amount',
      render: (row) => (
        <span className={Number(row.amount) < 0 ? 'text-red-300' : 'text-emerald-300'}>
          {formatUsd(row.amount)}
        </span>
      ),
    },
    {
      key: 'balanceField',
      header: 'Field',
      render: (row) => <span className="font-mono text-xs">{row.balanceField}</span>,
    },
    {
      key: 'description',
      header: 'Description',
      render: (row) => <span className="text-sm text-muted">{row.description || '—'}</span>,
    },
    {
      key: 'createdAt',
      header: 'When',
      render: (row) => <span className="text-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Earnings" description="Ledger and manual adjustments" />

      {hasPermission('earnings:adjust') ? (
        <form
          onSubmit={onAdjust}
          className="mb-6 grid gap-3 rounded-xl border border-border bg-surface p-4 sm:grid-cols-2 lg:grid-cols-5"
        >
          <label className="text-sm lg:col-span-1">
            <span className="mb-1 block text-muted">User ID</span>
            <input
              required
              value={userId}
              onChange={(e) => setUserId(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Amount (USD)</span>
            <input
              required
              type="number"
              step="0.0001"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
            />
          </label>
          <label className="text-sm">
            <span className="mb-1 block text-muted">Balance field</span>
            <select
              value={balanceField}
              onChange={(e) => setBalanceField(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
            >
              <option value="manualAdjustmentUsd">manualAdjustmentUsd</option>
              <option value="ogEarnBalanceUsd">ogEarnBalanceUsd</option>
              <option value="ogRoyaltyBalanceUsd">ogRoyaltyBalanceUsd</option>
              <option value="referralBalanceUsd">referralBalanceUsd</option>
            </select>
          </label>
          <label className="text-sm sm:col-span-2 lg:col-span-1">
            <span className="mb-1 block text-muted">Reason</span>
            <input
              required
              minLength={3}
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
            />
          </label>
          <div className="flex items-end">
            <button
              type="submit"
              disabled={mutation.isPending}
              className="brand-gradient-bg w-full rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
            >
              {mutation.isPending ? 'Applying…' : 'Adjust'}
            </button>
          </div>
        </form>
      ) : null}

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        total={data?.pagination.total}
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
