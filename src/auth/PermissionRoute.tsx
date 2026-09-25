import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from './AuthContext';

interface PermissionRouteProps {
  permission: string | string[];
}

export function PermissionRoute({ permission }: PermissionRouteProps) {
  const { hasPermission, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex min-h-[40vh] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (!hasPermission(permission)) {
    return <Navigate to="/403" replace />;
  }

  return <Outlet />;
}
