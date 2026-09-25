import { Link } from 'react-router-dom';
import { ShieldAlert } from 'lucide-react';

export function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center text-center">
      <ShieldAlert className="mb-4 h-12 w-12 text-[var(--danger)]" />
      <h1 className="font-display text-3xl font-bold">403</h1>
      <p className="mt-2 max-w-md text-muted">
        You do not have permission to access this page. Contact a super admin if you need access.
      </p>
      <Link
        to="/dashboard"
        className="brand-gradient-bg mt-6 rounded-lg px-4 py-2 text-sm font-medium text-white"
      >
        Back to dashboard
      </Link>
    </div>
  );
}
