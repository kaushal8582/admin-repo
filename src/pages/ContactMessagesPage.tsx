import { useCallback, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { CheckCheck, Eye, Mail, MailOpen, RotateCcw, XCircle } from 'lucide-react';
import { getContactStats, listContactMessages, updateContactMessage } from '../api/contact';
import { PageHeader } from '../components/PageHeader';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { RowActionsMenu, type RowActionItem } from '../components/RowActionsMenu';
import { ContactMessageModal } from '../components/contact/ContactMessageModal';
import {
  CONTACT_STATUS_LABELS,
  CONTACT_SUBJECT_LABELS,
  buildReplyMailto,
  contactSubjectLabel,
} from '../components/contact/contactLabels';
import { useAuth } from '../auth/AuthContext';
import type { ContactMessageItem } from '../types';
import { cn, formatDate, getErrorMessage } from '../lib/utils';

const selectClass =
  'rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none';

export function ContactMessagesPage() {
  const { hasPermission } = useAuth();
  const canManage = hasPermission('contact:manage');
  const qc = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  const openId = searchParams.get('id');

  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('OPEN');
  const [subject, setSubject] = useState('');

  const setOpenId = useCallback(
    (id: string | null) => {
      const next = new URLSearchParams(searchParams);
      if (id) next.set('id', id);
      else next.delete('id');
      setSearchParams(next, { replace: true });
    },
    [searchParams, setSearchParams]
  );
  const closeModal = useCallback(() => setOpenId(null), [setOpenId]);

  const { data, isLoading } = useQuery({
    queryKey: ['contact-messages', page, search, status, subject],
    queryFn: () =>
      listContactMessages({
        page,
        limit: 25,
        search: search || undefined,
        status: status || undefined,
        subject: subject || undefined,
      }),
  });

  const { data: stats } = useQuery({ queryKey: ['contact-stats'], queryFn: getContactStats });

  const statusMutation = useMutation({
    mutationFn: ({ id, next }: { id: string; next: string }) =>
      updateContactMessage(id, { status: next }),
    onSuccess: (updated) => {
      qc.setQueryData(['contact-message', updated.id], updated);
      void qc.invalidateQueries({ queryKey: ['contact-messages'] });
      void qc.invalidateQueries({ queryKey: ['contact-stats'] });
      toast.success(`Marked as ${CONTACT_STATUS_LABELS[updated.status]?.toLowerCase()}`);
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const rowActions = (row: ContactMessageItem): RowActionItem[] => {
    const items: RowActionItem[] = [
      { key: 'view', label: 'View message', icon: <Eye className="h-4 w-4" />, onSelect: () => setOpenId(row.id) },
      {
        key: 'reply',
        label: 'Reply by email',
        icon: <Mail className="h-4 w-4" />,
        onSelect: () => {
          window.location.href = buildReplyMailto(row);
        },
      },
    ];
    if (!canManage) return items;
    const set = (next: string) => statusMutation.mutate({ id: row.id, next });
    items.push({ type: 'separator', key: 'sep' });
    if (row.status === 'NEW') {
      items.push({ key: 'read', label: 'Mark as read', icon: <MailOpen className="h-4 w-4" />, onSelect: () => set('READ') });
    }
    if (row.status !== 'REPLIED') {
      items.push({ key: 'replied', label: 'Mark as replied', icon: <CheckCheck className="h-4 w-4" />, onSelect: () => set('REPLIED') });
    }
    if (row.status !== 'CLOSED') {
      items.push({ key: 'close', label: 'Close', icon: <XCircle className="h-4 w-4" />, onSelect: () => set('CLOSED') });
    } else {
      items.push({ key: 'reopen', label: 'Reopen', icon: <RotateCcw className="h-4 w-4" />, onSelect: () => set('READ') });
    }
    return items;
  };

  const columns: DataTableColumn<ContactMessageItem>[] = [
    {
      key: 'from',
      header: 'From',
      render: (row) => (
        <div className="min-w-[160px]">
          <p className={cn('text-sm', row.status === 'NEW' ? 'font-semibold text-foreground' : 'font-medium')}>
            {row.name}
          </p>
          <p className="text-xs text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'subject',
      header: 'Subject',
      render: (row) => (
        <span className="rounded-md border border-border px-2 py-0.5 text-xs text-muted">
          {contactSubjectLabel(row.subject)}
        </span>
      ),
    },
    {
      key: 'message',
      header: 'Message',
      render: (row) => (
        <p
          className={cn(
            'line-clamp-2 max-w-md text-sm',
            row.status === 'NEW' ? 'text-foreground' : 'text-muted'
          )}
        >
          {row.message}
        </p>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'createdAt',
      header: 'Received',
      render: (row) => <span className="whitespace-nowrap text-muted">{formatDate(row.createdAt)}</span>,
    },
  ];

  const counts = stats?.counts;
  const chips: Array<{ value: string; label: string; count?: number }> = [
    { value: 'OPEN', label: 'Open', count: counts ? counts.NEW + counts.READ : undefined },
    { value: 'NEW', label: 'New', count: counts?.NEW },
    { value: 'READ', label: 'Read', count: counts?.READ },
    { value: 'REPLIED', label: 'Replied', count: counts?.REPLIED },
    { value: 'CLOSED', label: 'Closed', count: counts?.CLOSED },
    { value: '', label: 'All', count: stats?.total },
  ];

  return (
    <div>
      <PageHeader title="Contact messages" description="Messages sent from the website contact form" />

      <div className="mb-4 flex flex-wrap gap-2">
        {chips.map((chip) => (
          <button
            key={chip.value || 'all'}
            type="button"
            onClick={() => {
              setStatus(chip.value);
              setPage(1);
            }}
            className={cn(
              'inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm',
              status === chip.value
                ? 'border-[var(--border-accent)] bg-[var(--accent-soft)] text-primary'
                : 'border-border text-muted hover:bg-white/5 hover:text-foreground'
            )}
          >
            {chip.label}
            {chip.count != null ? (
              <span className="rounded-full bg-white/10 px-1.5 text-xs tabular-nums">{chip.count}</span>
            ) : null}
          </button>
        ))}
      </div>

      <DataTable
        columns={columns}
        data={data?.data ?? []}
        loading={isLoading}
        total={data?.pagination.total}
        page={page}
        pageSize={25}
        search={search}
        searchPlaceholder="Search name, email or message…"
        rowKey={(r) => r.id}
        onPageChange={setPage}
        onRowClick={(row) => setOpenId(row.id)}
        onSearchChange={(value) => {
          setSearch(value.trim());
          setPage(1);
        }}
        emptyTitle="No messages"
        emptyDescription="Nothing matches these filters."
        toolbar={
          <select
            value={subject}
            onChange={(e) => {
              setSubject(e.target.value);
              setPage(1);
            }}
            className={selectClass}
          >
            <option value="">All subjects</option>
            {Object.entries(CONTACT_SUBJECT_LABELS).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </select>
        }
        rowActions={(row) => <RowActionsMenu items={rowActions(row)} />}
      />

      <ContactMessageModal messageId={openId} canManage={canManage} onClose={closeModal} />
    </div>
  );
}
