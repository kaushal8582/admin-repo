import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Eye } from 'lucide-react';
import { listVideos, disableVideo, restoreVideo } from '../../api/videos';
import { PageHeader } from '../../components/PageHeader';
import { DataTable, type DataTableColumn } from '../../components/DataTable';
import { StatusBadge } from '../../components/StatusBadge';
import { ConfirmDialog } from '../../components/ConfirmDialog';
import { useAuth } from '../../auth/AuthContext';
import type { VideoItem } from '../../types';
import { formatBytes, formatDate, formatNumber, getErrorMessage } from '../../lib/utils';

export function VideosPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');
  const [confirm, setConfirm] = useState<{ video: VideoItem; action: 'disable' | 'restore' } | null>(
    null
  );

  const { data, isLoading } = useQuery({
    queryKey: ['videos', page, search, sortBy, sortOrder],
    queryFn: () => listVideos({ page, limit: 25, search, sortBy, sortOrder }),
  });

  const mutation = useMutation({
    mutationFn: async ({
      id,
      action,
      reason,
    }: {
      id: string;
      action: 'disable' | 'restore';
      reason: string;
    }) => {
      if (action === 'disable') return disableVideo(id, reason);
      return restoreVideo(id, reason);
    },
    onSuccess: () => {
      toast.success(confirm?.action === 'disable' ? 'Video disabled' : 'Video restored');
      setConfirm(null);
      void qc.invalidateQueries({ queryKey: ['videos'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: DataTableColumn<VideoItem>[] = [
    {
      key: 'title',
      header: 'Video',
      sortable: true,
      render: (row) => (
        <div>
          <Link to={`/videos/${row.id}`} className="font-medium hover:text-primary">
            {row.title || 'Untitled'}
          </Link>
          <p className="text-xs text-muted">{row.owner?.email || '—'}</p>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'moderationStatus',
      header: 'Moderation',
      render: (row) => <StatusBadge status={row.moderationStatus} />,
    },
    {
      key: 'viewCount',
      header: 'Views',
      sortable: true,
      render: (row) => formatNumber(row.viewCount),
    },
    {
      key: 'size',
      header: 'Size',
      sortable: true,
      render: (row) => formatBytes(row.size),
    },
    {
      key: 'createdAt',
      header: 'Uploaded',
      sortable: true,
      render: (row) => <span className="text-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader title="Videos" description="Moderate and manage uploaded content" />
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
              to={`/videos/${row.id}`}
              className="rounded-md border border-border p-1.5 text-muted hover:text-foreground"
            >
              <Eye className="h-4 w-4" />
            </Link>
            {row.moderationStatus === 'DISABLED' || row.moderationStatus === 'REMOVED'
              ? hasPermission('videos:restore') && (
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs text-emerald-300 hover:bg-emerald-500/10"
                    onClick={() => setConfirm({ video: row, action: 'restore' })}
                  >
                    Restore
                  </button>
                )
              : hasPermission('videos:disable') && (
                  <button
                    type="button"
                    className="rounded-md border border-border px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                    onClick={() => setConfirm({ video: row, action: 'disable' })}
                  >
                    Disable
                  </button>
                )}
          </>
        )}
      />

      <ConfirmDialog
        open={Boolean(confirm)}
        title={confirm?.action === 'disable' ? 'Disable video' : 'Restore video'}
        requireReason={confirm?.action === 'disable'}
        danger={confirm?.action === 'disable'}
        confirmLabel={confirm?.action === 'disable' ? 'Disable' : 'Restore'}
        loading={mutation.isPending}
        onClose={() => setConfirm(null)}
        onConfirm={async (reason) => {
          if (!confirm) return;
          await mutation.mutateAsync({
            id: confirm.video.id,
            action: confirm.action,
            reason,
          });
        }}
      />
    </div>
  );
}
