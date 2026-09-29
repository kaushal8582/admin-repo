import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react';
import { createPortal } from 'react-dom';
import { MoreVertical } from 'lucide-react';
import { cn } from '../lib/utils';

export type RowActionItem =
  | {
      type?: 'item';
      key: string;
      label: string;
      icon?: ReactNode;
      danger?: boolean;
      disabled?: boolean;
      onSelect: () => void;
    }
  | { type: 'separator'; key: string }
  | { type: 'label'; key: string; label: string };

interface RowActionsMenuProps {
  items: RowActionItem[];
  label?: string;
  className?: string;
}

const MENU_WIDTH = 208;

/** Three-dot menu rendered in a portal so table overflow does not clip it. */
export function RowActionsMenu({ items, label = 'Actions', className }: RowActionsMenuProps) {
  const [open, setOpen] = useState(false);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!open || !buttonRef.current) return;
    const rect = buttonRef.current.getBoundingClientRect();
    const menuHeight = menuRef.current?.offsetHeight ?? 0;
    const spaceBelow = window.innerHeight - rect.bottom;
    const top =
      menuHeight && spaceBelow < menuHeight + 8 ? rect.top - menuHeight - 4 : rect.bottom + 4;
    const left = Math.max(8, Math.min(rect.right - MENU_WIDTH, window.innerWidth - MENU_WIDTH - 8));
    setPos({ top: Math.max(8, top), left });
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const close = () => setOpen(false);
    const onPointer = (e: MouseEvent) => {
      const t = e.target as Node;
      if (menuRef.current?.contains(t) || buttonRef.current?.contains(t)) return;
      close();
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') close();
    };
    document.addEventListener('mousedown', onPointer);
    document.addEventListener('keydown', onKey);
    window.addEventListener('resize', close);
    window.addEventListener('scroll', close, true);
    return () => {
      document.removeEventListener('mousedown', onPointer);
      document.removeEventListener('keydown', onKey);
      window.removeEventListener('resize', close);
      window.removeEventListener('scroll', close, true);
    };
  }, [open]);

  if (items.length === 0) return null;

  return (
    <>
      <button
        ref={buttonRef}
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation();
          setOpen((v) => !v);
        }}
        className={cn(
          'rounded-md p-1.5 text-muted hover:bg-white/5 hover:text-foreground',
          open && 'bg-white/5 text-foreground',
          className
        )}
      >
        <MoreVertical className="h-4 w-4" />
      </button>
      {open
        ? createPortal(
            <div
              ref={menuRef}
              role="menu"
              style={{
                position: 'fixed',
                top: pos?.top ?? -9999,
                left: pos?.left ?? -9999,
                width: MENU_WIDTH,
              }}
              className="z-[60] overflow-hidden rounded-lg border border-border bg-surface-elevated py-1 shadow-xl"
              onClick={(e) => e.stopPropagation()}
            >
              {items.map((item) => {
                if (item.type === 'separator') {
                  return <div key={item.key} className="my-1 border-t border-border" />;
                }
                if (item.type === 'label') {
                  return (
                    <p
                      key={item.key}
                      className="px-3 pb-1 pt-2 text-[11px] font-medium uppercase tracking-wide text-muted"
                    >
                      {item.label}
                    </p>
                  );
                }
                return (
                  <button
                    key={item.key}
                    type="button"
                    role="menuitem"
                    disabled={item.disabled}
                    onClick={() => {
                      setOpen(false);
                      item.onSelect();
                    }}
                    className={cn(
                      'flex w-full items-center gap-2 px-3 py-2 text-left text-sm hover:bg-white/5 disabled:opacity-40',
                      item.danger ? 'text-red-300' : 'text-foreground'
                    )}
                  >
                    {item.icon ? <span className="text-muted">{item.icon}</span> : null}
                    {item.label}
                  </button>
                );
              })}
            </div>,
            document.body
          )
        : null}
    </>
  );
}
