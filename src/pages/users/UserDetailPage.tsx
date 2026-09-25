import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { getUser, suspendUser, unsuspendUser } from '../../api/users';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useAuth } from '../../auth/AuthContext';
import {
  formatBytes,
  formatDate,
  formatNumber,
  formatRole,
  formatUsd,
  getErrorMessage,
} from '../../lib/utils';

export function UserDetailPage() {
  const { id = '' } = useParams();
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<'suspend' | 'unsuspend' | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['users', id],
    queryFn: () => getUser(id),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: async ({ action, reason }: { action: 'suspend' | 'unsuspend'; reason: string }) => {
      if (action === 'suspend') return suspendUser(id, reason);
      return unsuspendUser(id, reason);
    },
    onSuccess: () => {
      toast.success(confirm === 'suspend' ? 'User suspended' : 'User unsuspended');
      setConfirm(null);
      void qc.invalidateQueries({ queryKey: ['users', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !data) {
    return <p className="text-sm text-[var(--danger)]">{getErrorMessage(error, 'User not found')}</p>;
  }

  const suspended = data.status === 'banned' || data.status === 'suspended';
  const wallet = (data.wallet || {}) as Record<string, number>;

  return (
    <div>
      <Link to="/users" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <PageHeader
        title={data.name || data.email || 'User'}
        description={data.email}
        actions={
          <>
            <StatusBadge status={data.status} />
            {suspended
              ? hasPermission('users:unsuspend') && (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
                    onClick={() => setConfirm('unsuspend')}
                  >
                    Unsuspend
                  </button>
                )
              : hasPermission('users:suspend') && (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                    onClick={() => setConfirm('suspend')}
                  >
                    Suspend
                  </button>
                )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Videos" value={formatNumber(data.stats?.videoCount)} />
        <StatCard label="Storage" value={formatBytes(data.stats?.storageBytes)} />
        <StatCard label="Views" value={formatNumber(data.stats?.totalViews)} />
        <StatCard label="Reports" value={formatNumber(data.stats?.reportCount)} />
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-display font-semibold">Profile</h2>
          <dl className="space-y-2 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Role</dt>
              <dd>{formatRole(data.role)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Joined</dt>
              <dd>{formatDate(data.createdAt)}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">User ID</dt>
              <dd className="truncate font-mono text-xs">{data.id}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-muted">Telegram</dt>
              <dd>
                {data.telegram?.connected
                  ? `@${data.telegram.telegramUsername || data.telegram.telegramUserId}`
                  : 'Not connected'}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-display font-semibold">Wallet</h2>
          <dl className="space-y-2 text-sm">
            {Object.keys(wallet).length === 0 ? (
              <p className="text-muted">No wallet data</p>
            ) : (
              Object.entries(wallet).map(([k, v]) => (
                <div key={k} className="flex justify-between gap-4">
                  <dt className="text-muted">{k}</dt>
                  <dd>{typeof v === 'number' ? formatUsd(v) : String(v)}</dd>
                </div>
              ))
            )}
          </dl>
        </section>
      </div>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm === 'suspend' ? 'Suspend user' : 'Unsuspend user'}
        requireReason={confirm === 'suspend'}
        danger={confirm === 'suspend'}
        confirmLabel={confirm === 'suspend' ? 'Suspend' : 'Unsuspend'}
        loading={mutation.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={async (reason) => {
          if (!confirm) return;
          await mutation.mutateAsync({ action: confirm, reason });
        }}
      />
    </div>
  );
}
