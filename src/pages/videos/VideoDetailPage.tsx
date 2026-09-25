import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { getVideo, disableVideo, restoreVideo } from '../../api/videos';
import { PageHeader } from '../../components/PageHeader';
import { StatCard } from '../../components/StatCard';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useAuth } from '../../auth/AuthContext';
import { formatBytes, formatDate, formatNumber, getErrorMessage } from '../../lib/utils';

export function VideoDetailPage() {
  const { id = '' } = useParams();
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [confirm, setConfirm] = useState<'disable' | 'restore' | null>(null);

  const { data, isLoading, error } = useQuery({
    queryKey: ['videos', id],
    queryFn: () => getVideo(id),
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: async ({ action, reason }: { action: 'disable' | 'restore'; reason: string }) => {
      if (action === 'disable') return disableVideo(id, reason);
      return restoreVideo(id, reason);
    },
    onSuccess: () => {
      toast.success(confirm === 'disable' ? 'Video disabled' : 'Video restored');
      setConfirm(null);
      void qc.invalidateQueries({ queryKey: ['videos', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !data) {
    return <p className="text-sm text-[var(--danger)]">{getErrorMessage(error, 'Video not found')}</p>;
  }

  const disabled =
    data.moderationStatus === 'DISABLED' || data.moderationStatus === 'REMOVED';

  return (
    <div>
      <Link to="/videos" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to videos
      </Link>

      <PageHeader
        title={data.title || 'Untitled video'}
        description={data.shareToken}
        actions={
          <>
            <StatusBadge status={data.moderationStatus} />
            {disabled
              ? hasPermission('videos:restore') && (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-2 text-sm text-emerald-300 hover:bg-emerald-500/10"
                    onClick={() => setConfirm('restore')}
                  >
                    Restore
                  </button>
                )
              : hasPermission('videos:disable') && (
                  <button
                    type="button"
                    className="rounded-lg border border-border px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
                    onClick={() => setConfirm('disable')}
                  >
                    Disable
                  </button>
                )}
          </>
        }
      />

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard label="Views" value={formatNumber(data.viewCount)} />
        <StatCard label="Size" value={formatBytes(data.size)} />
        <StatCard label="Reports" value={formatNumber(data.reportCount)} />
        <StatCard label="OG links" value={formatNumber(data.ogLinkCount)} />
      </div>

      <section className="rounded-xl border border-border bg-surface p-4">
        <h2 className="mb-3 font-display font-semibold">Details</h2>
        <dl className="grid gap-3 text-sm sm:grid-cols-2">
          <div>
            <dt className="text-muted">Owner</dt>
            <dd>
              {data.owner?.id ? (
                <Link to={`/users/${data.owner.id}`} className="text-primary hover:underline">
                  {data.owner.email || data.owner.name}
                </Link>
              ) : (
                '—'
              )}
            </dd>
          </div>
          <div>
            <dt className="text-muted">Status</dt>
            <dd>
              <StatusBadge status={data.status} />
            </dd>
          </div>
          <div>
            <dt className="text-muted">Uploaded</dt>
            <dd>{formatDate(data.createdAt)}</dd>
          </div>
          <div>
            <dt className="text-muted">Share URL</dt>
            <dd className="truncate">{data.shareUrl || '—'}</dd>
          </div>
          {data.moderationReason ? (
            <div className="sm:col-span-2">
              <dt className="text-muted">Moderation reason</dt>
              <dd>{String(data.moderationReason)}</dd>
            </div>
          ) : null}
        </dl>
      </section>

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm === 'disable' ? 'Disable video' : 'Restore video'}
        requireReason={confirm === 'disable'}
        danger={confirm === 'disable'}
        confirmLabel={confirm === 'disable' ? 'Disable' : 'Restore'}
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
