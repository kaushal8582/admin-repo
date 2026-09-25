import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { getSettings, updateSettings } from '../api/settings';
import { PageHeader } from '../components/PageHeader';
import { LoadingSkeleton } from '../components/LoadingSkeleton';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../lib/utils';

export function SettingsPage() {
  const { hasPermission } = useAuth();
  const qc = useQueryClient();
  const canManage = hasPermission('settings:manage');

  const { data, isLoading, error } = useQuery({
    queryKey: ['settings'],
    queryFn: getSettings,
  });

  const [videoUploadsEnabled, setVideoUploadsEnabled] = useState(true);
  const [ogEarnEnabled, setOgEarnEnabled] = useState(true);
  const [telegramEnabled, setTelegramEnabled] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');

  useEffect(() => {
    if (!data?.settings) return;
    setVideoUploadsEnabled(Boolean(data.settings.videoUploadsEnabled?.value ?? true));
    setOgEarnEnabled(Boolean(data.settings.ogEarnEnabled?.value ?? true));
    setTelegramEnabled(Boolean(data.settings.telegramEnabled?.value ?? true));
    setMaintenanceMessage(String(data.settings.maintenanceMessage?.value ?? ''));
  }, [data]);

  const mutation = useMutation({
    mutationFn: () =>
      updateSettings({
        settings: {
          videoUploadsEnabled,
          ogEarnEnabled,
          telegramEnabled,
          maintenanceMessage,
        },
      }),
    onSuccess: () => {
      toast.success('Settings updated');
      void qc.invalidateQueries({ queryKey: ['settings'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  if (isLoading) return <LoadingSkeleton rows={5} />;
  if (error) return <p className="text-sm text-[var(--danger)]">{getErrorMessage(error)}</p>;

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    mutation.mutate();
  };

  return (
    <div>
      <PageHeader title="Settings" description="Safe platform feature flags" />

      <form
        onSubmit={onSubmit}
        className="max-w-xl space-y-4 rounded-xl border border-border bg-surface p-5"
      >
        {(
          [
            {
              key: 'videoUploadsEnabled',
              label: 'Video uploads enabled',
              value: videoUploadsEnabled,
              set: setVideoUploadsEnabled,
            },
            {
              key: 'ogEarnEnabled',
              label: 'OG Earn enabled',
              value: ogEarnEnabled,
              set: setOgEarnEnabled,
            },
            {
              key: 'telegramEnabled',
              label: 'Telegram enabled',
              value: telegramEnabled,
              set: setTelegramEnabled,
            },
          ] as const
        ).map((item) => (
          <label
            key={item.key}
            className="flex items-center justify-between gap-4 rounded-lg border border-border bg-background px-4 py-3"
          >
            <span className="text-sm font-medium">{item.label}</span>
            <input
              type="checkbox"
              checked={item.value}
              disabled={!canManage}
              onChange={(e) => item.set(e.target.checked)}
              className="h-4 w-4"
            />
          </label>
        ))}

        <label className="block text-sm">
          <span className="mb-1.5 block text-muted">Maintenance message</span>
          <textarea
            value={maintenanceMessage}
            disabled={!canManage}
            onChange={(e) => setMaintenanceMessage(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-border bg-background px-3 py-2 outline-none disabled:opacity-60"
            placeholder="Shown when platform is in maintenance…"
          />
        </label>

        {canManage ? (
          <button
            type="submit"
            disabled={mutation.isPending}
            className="brand-gradient-bg rounded-lg px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
          >
            {mutation.isPending ? 'Saving…' : 'Save settings'}
          </button>
        ) : (
          <p className="text-sm text-muted">You have view-only access to settings.</p>
        )}
      </form>
    </div>
  );
}
