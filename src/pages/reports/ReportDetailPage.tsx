import { useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { ArrowLeft } from 'lucide-react';
import { getReport, updateReport } from '../../api/reports';
import { PageHeader } from '../../components/PageHeader';
import { StatusBadge } from '../../components/StatusBadge';
import { LoadingSkeleton } from '../../components/LoadingSkeleton';
import { useAuth } from '../../auth/AuthContext';
import { formatDate, getErrorMessage } from '../../lib/utils';

const TRANSITIONS: Record<string, string[]> = {
  PENDING: ['UNDER_REVIEW'],
  UNDER_REVIEW: ['ACTION_TAKEN', 'REJECTED', 'RESOLVED'],
  ACTION_TAKEN: [],
  REJECTED: [],
  RESOLVED: [],
};

export function ReportDetailPage() {
  const { id = '' } = useParams();
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [actionTaken, setActionTaken] = useState('');
  const [disableVideoFlag, setDisableVideoFlag] = useState(false);

  const { data, isLoading, error } = useQuery({
    queryKey: ['reports', id],
    queryFn: async () => {
      const report = await getReport(id);
      setStatus(report.status || '');
      setAdminNotes(report.adminNotes || '');
      setActionTaken(report.actionTaken || '');
      return report;
    },
    enabled: Boolean(id),
  });

  const mutation = useMutation({
    mutationFn: () =>
      updateReport(id, {
        status,
        adminNotes,
        actionTaken: actionTaken || undefined,
        disableVideo: disableVideoFlag || undefined,
      }),
    onSuccess: () => {
      toast.success('Report updated');
      void qc.invalidateQueries({ queryKey: ['reports', id] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <LoadingSkeleton rows={6} />;
  if (error || !data) {
    return <p className="text-sm text-[var(--danger)]">{getErrorMessage(error, 'Report not found')}</p>;
  }

  const nextStatuses = TRANSITIONS[data.status || ''] || [];
  const canManage = hasPermission('reports:manage');

  return (
    <div>
      <Link to="/reports" className="mb-4 inline-flex items-center gap-1 text-sm text-muted hover:text-foreground">
        <ArrowLeft className="h-4 w-4" /> Back to reports
      </Link>

      <PageHeader
        title={data.reason || 'Report'}
        description={`Created ${formatDate(data.createdAt)}`}
        actions={<StatusBadge status={data.status} />}
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-display font-semibold">Details</h2>
          <dl className="space-y-3 text-sm">
            <div>
              <dt className="text-muted">Description</dt>
              <dd className="mt-1 whitespace-pre-wrap">{data.description || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Reporter</dt>
              <dd>{data.reporterEmail || data.reporterName || '—'}</dd>
            </div>
            <div>
              <dt className="text-muted">Video</dt>
              <dd>
                {data.video?.id ? (
                  <Link to={`/videos/${data.video.id}`} className="text-primary hover:underline">
                    {data.video.title || data.video.id}
                  </Link>
                ) : (
                  data.reportedUrl || '—'
                )}
              </dd>
            </div>
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
          </dl>
        </section>

        <section className="rounded-xl border border-border bg-surface p-4">
          <h2 className="mb-3 font-display font-semibold">Workflow</h2>
          {canManage && nextStatuses.length > 0 ? (
            <form
              className="space-y-3"
              onSubmit={(e) => {
                e.preventDefault();
                mutation.mutate();
              }}
            >
              <label className="block text-sm">
                <span className="mb-1 block text-muted">New status</span>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
                  required
                >
                  <option value={data.status}>{data.status}</option>
                  {nextStatuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Admin notes</span>
                <textarea
                  value={adminNotes}
                  onChange={(e) => setAdminNotes(e.target.value)}
                  rows={3}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
                />
              </label>
              <label className="block text-sm">
                <span className="mb-1 block text-muted">Action taken</span>
                <input
                  value={actionTaken}
                  onChange={(e) => setActionTaken(e.target.value)}
                  className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none"
                />
              </label>
              <label className="flex items-center gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={disableVideoFlag}
                  onChange={(e) => setDisableVideoFlag(e.target.checked)}
                />
                Also disable related video
              </label>
              <button
                type="submit"
                disabled={mutation.isPending || status === data.status}
                className="brand-gradient-bg rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
              >
                {mutation.isPending ? 'Updating…' : 'Update report'}
              </button>
            </form>
          ) : (
            <p className="text-sm text-muted">
              {canManage
                ? 'This report is in a terminal status.'
                : 'You do not have permission to manage reports.'}
            </p>
          )}
        </section>
      </div>
    </div>
  );
}
