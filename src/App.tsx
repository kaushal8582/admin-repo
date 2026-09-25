import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './auth/AuthContext';
import { ProtectedRoute } from './auth/ProtectedRoute';
import { PermissionRoute } from './auth/PermissionRoute';
import { AdminLayout } from './layouts/AdminLayout';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { UsersPage } from './pages/users/UsersPage';
import { UserDetailPage } from './pages/users/UserDetailPage';
import { VideosPage } from './pages/videos/VideosPage';
import { VideoDetailPage } from './pages/videos/VideoDetailPage';
import { ReportsPage } from './pages/reports/ReportsPage';
import { ReportDetailPage } from './pages/reports/ReportDetailPage';
import { OgEarnPage } from './pages/OgEarnPage';
import { EarningsPage } from './pages/EarningsPage';
import { WithdrawalsPage } from './pages/WithdrawalsPage';
import { TelegramOverviewPage } from './pages/telegram/TelegramOverviewPage';
import { TelegramUsersPage } from './pages/telegram/TelegramUsersPage';
import { TelegramGroupsPage } from './pages/telegram/TelegramGroupsPage';
import { TelegramChannelsPage } from './pages/telegram/TelegramChannelsPage';
import { StoragePage } from './pages/StoragePage';
import { SystemPage } from './pages/SystemPage';
import { AuditLogsPage } from './pages/AuditLogsPage';
import { AdminsPage } from './pages/AdminsPage';
import { SettingsPage } from './pages/SettingsPage';
import { ForbiddenPage } from './pages/ForbiddenPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Routes> 
            <Route path="/login" element={<LoginPage />} />

            <Route element={<ProtectedRoute />}>
              <Route element={<AdminLayout />}>
                <Route index element={<Navigate to="/dashboard" replace />} />

                <Route element={<PermissionRoute permission="dashboard:view" />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                </Route>

                <Route element={<PermissionRoute permission="users:view" />}>
                  <Route path="/users" element={<UsersPage />} />
                  <Route path="/users/:id" element={<UserDetailPage />} />
                </Route>

                <Route element={<PermissionRoute permission="videos:view" />}>
                  <Route path="/videos" element={<VideosPage />} />
                  <Route path="/videos/:id" element={<VideoDetailPage />} />
                </Route>

                <Route element={<PermissionRoute permission="reports:view" />}>
                  <Route path="/reports" element={<ReportsPage />} />
                  <Route path="/reports/:id" element={<ReportDetailPage />} />
                </Route>

                <Route element={<PermissionRoute permission="earnings:view" />}>
                  <Route path="/og-earn" element={<OgEarnPage />} />
                  <Route path="/earnings" element={<EarningsPage />} />
                </Route>

                <Route element={<PermissionRoute permission="withdrawals:view" />}>
                  <Route path="/withdrawals" element={<WithdrawalsPage />} />
                </Route>

                <Route element={<PermissionRoute permission="telegram:view" />}>
                  <Route path="/telegram" element={<TelegramOverviewPage />} />
                  <Route path="/telegram/users" element={<TelegramUsersPage />} />
                  <Route path="/telegram/groups" element={<TelegramGroupsPage />} />
                  <Route path="/telegram/channels" element={<TelegramChannelsPage />} />
                </Route>

                <Route element={<PermissionRoute permission="storage:view" />}>
                  <Route path="/storage" element={<StoragePage />} />
                </Route>

                <Route element={<PermissionRoute permission="system:view" />}>
                  <Route path="/system" element={<SystemPage />} />
                </Route>

                <Route element={<PermissionRoute permission="audit:view" />}>
                  <Route path="/audit-logs" element={<AuditLogsPage />} />
                </Route>

                <Route element={<PermissionRoute permission="admins:view" />}>
                  <Route path="/admins" element={<AdminsPage />} />
                </Route>

                <Route element={<PermissionRoute permission="settings:view" />}>
                  <Route path="/settings" element={<SettingsPage />} />
                </Route>

                <Route path="/403" element={<ForbiddenPage />} />
              </Route>
            </Route>

            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </BrowserRouter>
        <Toaster
          position="top-right"
          toastOptions={{
            style: {
              background: '#121a2e',
              color: '#fff',
              border: '1px solid rgba(255,255,255,0.08)',
            },
          }}
        />
      </AuthProvider>
    </QueryClientProvider>
  );
}
