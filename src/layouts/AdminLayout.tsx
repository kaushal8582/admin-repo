import { useMemo, useState, type ReactNode } from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Users,
  Video,
  Flag,
  Coins,
  Wallet,
  Banknote,
  Send,
  HardDrive,
  Activity,
  ScrollText,
  Shield,
  Settings,
  LogOut,
  Menu,
  X,
  UserRound,
} from 'lucide-react';
import { useAuth } from '../auth/AuthContext';
import { cn, formatRole } from '../lib/utils';

interface NavItem {
  to: string;
  label: string;
  icon: ReactNode;
  permission?: string | string[];
  end?: boolean;
}

interface NavSection {
  title?: string;
  items: NavItem[];
}

const SECTIONS: NavSection[] = [
  {
    items: [
      {
        to: '/dashboard',
        label: 'Dashboard',
        icon: <LayoutDashboard className="h-4 w-4" />,
        permission: 'dashboard:view',
        end: true,
      },
    ],
  },
  {
    title: 'Management',
    items: [
      { to: '/users', label: 'Users', icon: <Users className="h-4 w-4" />, permission: 'users:view' },
      { to: '/videos', label: 'Videos', icon: <Video className="h-4 w-4" />, permission: 'videos:view' },
      { to: '/reports', label: 'Reports', icon: <Flag className="h-4 w-4" />, permission: 'reports:view' },
    ],
  },
  {
    title: 'Monetization',
    items: [
      { to: '/og-earn', label: 'OG Earn', icon: <Coins className="h-4 w-4" />, permission: 'earnings:view' },
      { to: '/earnings', label: 'Earnings', icon: <Wallet className="h-4 w-4" />, permission: 'earnings:view' },
      {
        to: '/withdrawals',
        label: 'Withdrawals',
        icon: <Banknote className="h-4 w-4" />,
        permission: 'withdrawals:view',
      },
    ],
  },
  {
    title: 'Telegram',
    items: [
      {
        to: '/telegram',
        label: 'Overview',
        icon: <Send className="h-4 w-4" />,
        permission: 'telegram:view',
        end: true,
      },
      {
        to: '/telegram/users',
        label: 'Connected Users',
        icon: <UserRound className="h-4 w-4" />,
        permission: 'telegram:view',
      },
      {
        to: '/telegram/groups',
        label: 'Groups',
        icon: <Users className="h-4 w-4" />,
        permission: 'telegram:view',
      },
      {
        to: '/telegram/channels',
        label: 'Channels',
        icon: <Send className="h-4 w-4" />,
        permission: 'telegram:view',
      },
    ],
  },
  {
    title: 'Infrastructure',
    items: [
      {
        to: '/storage',
        label: 'Storage',
        icon: <HardDrive className="h-4 w-4" />,
        permission: 'storage:view',
      },
      {
        to: '/system',
        label: 'System Health',
        icon: <Activity className="h-4 w-4" />,
        permission: 'system:view',
      },
    ],
  },
  {
    title: 'Security',
    items: [
      {
        to: '/audit-logs',
        label: 'Audit Logs',
        icon: <ScrollText className="h-4 w-4" />,
        permission: 'audit:view',
      },
      {
        to: '/admins',
        label: 'Admins',
        icon: <Shield className="h-4 w-4" />,
        permission: 'admins:view',
      },
    ],
  },
  {
    items: [
      {
        to: '/settings',
        label: 'Settings',
        icon: <Settings className="h-4 w-4" />,
        permission: 'settings:view',
      },
    ],
  },
];

function SidebarNav({
  onNavigate,
  hasPermission,
}: {
  onNavigate?: () => void;
  hasPermission: (p: string | string[]) => boolean;
}) {
  return (
    <nav className="flex-1 space-y-5 overflow-y-auto px-3 py-4">
      {SECTIONS.map((section, idx) => {
        const items = section.items.filter(
          (item) => !item.permission || hasPermission(item.permission)
        );
        if (items.length === 0) return null;
        return (
          <div key={section.title || `s-${idx}`}>
            {section.title ? (
              <p className="mb-2 px-2 text-[11px] font-semibold uppercase tracking-wider text-muted/80">
                {section.title}
              </p>
            ) : null}
            <ul className="space-y-0.5">
              {items.map((item) => (
                <li key={item.to}>
                  <NavLink
                    to={item.to}
                    end={item.end}
                    onClick={onNavigate}
                    className={({ isActive }) =>
                      cn(
                        'flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm transition-colors',
                        isActive
                          ? 'bg-[var(--accent-soft)] text-primary'
                          : 'text-muted hover:bg-white/5 hover:text-foreground'
                      )
                    }
                  >
                    {item.icon}
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </div>
        );
      })}
    </nav>
  );
}

export function AdminLayout() {
  const { user, logout, hasPermission } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);

  const sidebar = useMemo(
    () => (
      <div className="flex h-full flex-col">
        <div className="border-b border-border px-4 py-4">
          <Link to="/dashboard" className="flex items-center gap-2" onClick={() => setMobileOpen(false)}>
            <img src="/favicon.png" alt="" className="h-8 w-8 rounded-lg" />
            <div>
              <p className="font-display text-sm font-bold brand-gradient-text">MastPlayer</p>
              <p className="text-[11px] text-muted">Admin</p>
            </div>
          </Link>
        </div>

        <SidebarNav
          hasPermission={hasPermission}
          onNavigate={() => setMobileOpen(false)}
        />

        <div className="border-t border-border p-3">
          <div className="mb-2 rounded-lg bg-surface-elevated/60 px-3 py-2">
            <p className="truncate text-sm font-medium text-foreground">{user?.name || 'Admin'}</p>
            <p className="truncate text-xs text-muted">{formatRole(user?.role)}</p>
          </div>
          <button
            type="button"
            onClick={async () => {
              await logout();
              navigate('/login');
            }}
            className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-sm text-muted hover:bg-[var(--danger-soft)] hover:text-[var(--danger)]"
          >
            <LogOut className="h-4 w-4" />
            Logout
          </button>
        </div>
      </div>
    ),
    [hasPermission, logout, navigate, user?.name, user?.role]
  );

  return (
    <div className="flex min-h-screen bg-background">
      <aside className="hidden w-64 shrink-0 border-r border-border bg-sidebar lg:block">
        {sidebar}
      </aside>

      {mobileOpen ? (
        <div className="fixed inset-0 z-40 lg:hidden">
          <button
            type="button"
            className="absolute inset-0 bg-black/60"
            aria-label="Close menu"
            onClick={() => setMobileOpen(false)}
          />
          <aside className="absolute left-0 top-0 h-full w-72 border-r border-border bg-sidebar shadow-xl">
            <button
              type="button"
              className="absolute right-3 top-4 rounded-md p-1 text-muted hover:bg-white/5"
              onClick={() => setMobileOpen(false)}
            >
              <X className="h-5 w-5" />
            </button>
            {sidebar}
          </aside>
        </div>
      ) : null}

      <div className="flex min-w-0 flex-1 flex-col">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-border bg-background/90 px-4 backdrop-blur lg:px-6">
          <button
            type="button"
            className="rounded-lg border border-border p-2 text-muted hover:bg-white/5 lg:hidden"
            onClick={() => setMobileOpen(true)}
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm text-muted">MastPlayer Admin Panel</p>
          </div>
          <div className="hidden text-right sm:block">
            <p className="text-sm font-medium text-foreground">{user?.email}</p>
          </div>
        </header>

        <main className="flex-1 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
