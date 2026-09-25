import { useMemo, useState, type ReactNode } from 'react';
import { ChevronLeft, ChevronRight, Search, ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { EmptyState } from './EmptyState';
import { LoadingSkeleton } from './LoadingSkeleton';
import { cn } from '../lib/utils';

export interface DataTableColumn<T> {
  key: string;
  header: string;
  sortable?: boolean;
  className?: string;
  render: (row: T) => ReactNode;
}

interface DataTableProps<T> {
  columns: DataTableColumn<T>[];
  data: T[];
  loading?: boolean;
  total?: number;
  page?: number;
  pageSize?: number;
  search?: string;
  searchPlaceholder?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  emptyTitle?: string;
  emptyDescription?: string;
  rowKey: (row: T) => string;
  onPageChange?: (page: number) => void;
  onSearchChange?: (search: string) => void;
  onSortChange?: (sortBy: string, sortOrder: 'asc' | 'desc') => void;
  toolbar?: ReactNode;
  rowActions?: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  data,
  loading,
  total = 0,
  page = 1,
  pageSize = 25,
  search = '',
  searchPlaceholder = 'Search…',
  sortBy,
  sortOrder = 'desc',
  emptyTitle,
  emptyDescription,
  rowKey,
  onPageChange,
  onSearchChange,
  onSortChange,
  toolbar,
  rowActions,
}: DataTableProps<T>) {
  const [localSearch, setLocalSearch] = useState(search);
  const totalPages = Math.max(1, Math.ceil(total / pageSize) || 1);

  const handleSearchSubmit = (value: string) => {
    setLocalSearch(value);
    onSearchChange?.(value);
  };

  const cols: DataTableColumn<T>[] = useMemo(() => {
    if (!rowActions) return columns;
    const actionsCol: DataTableColumn<T> = {
      key: '_actions',
      header: '',
      render: (row: T) => (
        <div className="flex justify-end gap-1 opacity-80 group-hover:opacity-100">
          {rowActions(row)}
        </div>
      ),
    };
    return [...columns, actionsCol];
  }, [columns, rowActions]);

  return (
    <div className="overflow-hidden rounded-xl border border-border bg-surface">
      {(onSearchChange || toolbar) && (
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          {onSearchChange ? (
            <div className="relative max-w-sm flex-1">
              <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
              <input
                value={localSearch}
                onChange={(e) => setLocalSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') handleSearchSubmit(localSearch);
                }}
                onBlur={() => {
                  if (localSearch !== search) handleSearchSubmit(localSearch);
                }}
                placeholder={searchPlaceholder}
                className="w-full rounded-lg border border-border bg-background py-2 pl-9 pr-3 text-sm text-foreground outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--input-focus-ring)]"
              />
            </div>
          ) : (
            <div />
          )}
          {toolbar}
        </div>
      )}

      <div className="overflow-x-auto">
        <table className="min-w-full text-left text-sm">
          <thead className="bg-surface-elevated/60 text-xs uppercase tracking-wide text-muted">
            <tr>
              {cols.map((col) => {
                const active = sortBy === col.key;
                return (
                  <th key={col.key} className={cn('px-4 py-3 font-medium', col.className)}>
                    {col.sortable && onSortChange ? (
                      <button
                        type="button"
                        className="inline-flex items-center gap-1 hover:text-foreground"
                        onClick={() => {
                          const nextOrder =
                            active && sortOrder === 'desc' ? 'asc' : 'desc';
                          onSortChange(col.key, active ? nextOrder : 'desc');
                        }}
                      >
                        {col.header}
                        {active ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp className="h-3.5 w-3.5" />
                          ) : (
                            <ArrowDown className="h-3.5 w-3.5" />
                          )
                        ) : (
                          <ArrowUpDown className="h-3.5 w-3.5 opacity-50" />
                        )}
                      </button>
                    ) : (
                      col.header
                    )}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={cols.length} className="p-4">
                  <LoadingSkeleton rows={6} />
                </td>
              </tr>
            ) : data.length === 0 ? (
              <tr>
                <td colSpan={cols.length} className="p-4">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            ) : (
              data.map((row) => (
                <tr
                  key={rowKey(row)}
                  className="group border-t border-border hover:bg-[var(--table-row-hover)]"
                >
                  {cols.map((col) => (
                    <td key={col.key} className={cn('px-4 py-3 align-middle', col.className)}>
                      {col.render(row)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {onPageChange && (
        <div className="flex items-center justify-between border-t border-border px-4 py-3 text-sm text-muted">
          <span>
            {total === 0
              ? '0 results'
              : `${(page - 1) * pageSize + 1}–${Math.min(page * pageSize, total)} of ${total}`}
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={page <= 1 || loading}
              onClick={() => onPageChange(page - 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 hover:bg-white/5 disabled:opacity-40"
            >
              <ChevronLeft className="h-4 w-4" /> Prev
            </button>
            <span className="min-w-[4rem] text-center text-foreground">
              {page} / {totalPages}
            </span>
            <button
              type="button"
              disabled={page >= totalPages || loading}
              onClick={() => onPageChange(page + 1)}
              className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1.5 hover:bg-white/5 disabled:opacity-40"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
