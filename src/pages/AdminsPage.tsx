import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { disableAdmin, listAdmins, updateAdminRole } from '../api/admins';
import { PageHeader } from '../components/PageHeader';
import { DataTable, type DataTableColumn } from '../components/DataTable';
import { StatusBadge } from '../components/StatusBadge';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { useAuth } from '../auth/AuthContext';
import type { AdminUser } from '../types';
import { formatDate, formatRole, getErrorMessage } from '../lib/utils';

const ROLES = ['super_admin', 'admin', 'moderator', 'support', 'finance'] as const;

export function AdminsPage() {
  const { user, hasPermission } = useAuth();
  const qc = useQueryClient();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [roleEdit, setRoleEdit] = useState<{ admin: AdminUser; role: string } | null>(null);
  const [disableTarget, setDisableTarget] = useState<AdminUser | null>(null);

  const canManage = hasPermission('admins:manage') && user?.role === 'super_admin';

  const { data, isLoading } = useQuery({
    queryKey: ['admins', page, search],
    queryFn: () => listAdmins({ page, limit: 25, search: search || undefined }),
  });

  const roleMutation = useMutation({
    mutationFn: ({ id, role, reason }: { id: string; role: string; reason: string }) =>
      updateAdminRole(id, role, reason),
    onSuccess: () => {
      toast.success('Role updated');
      setRoleEdit(null);
      void qc.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const disableMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) =>
      disableAdmin(id, 'ban', reason),
    onSuccess: () => {
      toast.success('Admin access disabled');
      setDisableTarget(null);
      void qc.invalidateQueries({ queryKey: ['admins'] });
    },
    onError: (err) => toast.error(getErrorMessage(err)),
  });

  const columns: DataTableColumn<AdminUser>[] = [
    {
      key: 'name',
      header: 'Admin',
      render: (row) => (
        <div>
          <p className="font-medium">{row.name}</p>
          <p className="text-xs text-muted">{row.email}</p>
        </div>
      ),
    },
    {
      key: 'role',
      header: 'Role',
      render: (row) =>
        canManage && row.id !== user?.id ? (
          <select
            value={row.role}
            onChange={(e) => setRoleEdit({ admin: row, role: e.target.value })}
            className="rounded-md border border-border bg-background px-2 py-1 text-sm outline-none"
          >
            {ROLES.map((r) => (
              <option key={r} value={r}>
                {formatRole(r)}
              </option>
            ))}
          </select>
        ) : (
          <span>{formatRole(row.role)}</span>
        ),
    },
    {
      key: 'status',
      header: 'Status',
      render: (row) => <StatusBadge status={row.status} />,
    },
    {
      key: 'lastAdminLoginAt',
      header: 'Last login',
      render: (row) => <span className="text-muted">{formatDate(row.lastAdminLoginAt)}</span>,
    },
  ];

  return (
    <div>
      <PageHeader
        title="Admins"
        description="Staff accounts and role management (super admin only for role changes)"
      />
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
        rowActions={(row) =>
          canManage && row.id !== user?.id && row.status !== 'banned' ? (
            <button
              type="button"
              className="rounded-md border border-border px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
              onClick={() => setDisableTarget(row)}
            >
              Disable
            </button>
          ) : null
        }
      />

      <ConfirmDialog
        open={Boolean(roleEdit)}
        title="Change admin role"
        description={
          roleEdit
            ? `Set ${roleEdit.admin.email} to ${formatRole(roleEdit.role)}`
            : undefined
        }
        requireReason
        confirmLabel="Update role"
        loading={roleMutation.isPending}
        onClose={() => setRoleEdit(null)}
        onConfirm={async (reason) => {
          if (!roleEdit) return;
          await roleMutation.mutateAsync({
            id: roleEdit.admin.id,
            role: roleEdit.role,
            reason,
          });
        }}
      />

      <ConfirmDialog
        open={Boolean(disableTarget)}
        title="Disable admin access"
        description={disableTarget ? `Disable ${disableTarget.email}?` : undefined}
        requireReason
        danger
        confirmLabel="Disable"
        loading={disableMutation.isPending}
        onClose={() => setDisableTarget(null)}
        onConfirm={async (reason) => {
          if (!disableTarget) return;
          await disableMutation.mutateAsync({ id: disableTarget.id, reason });
        }}
      />
    </div>
  );
}
