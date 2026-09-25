import { useState, type FormEvent } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import { useAuth } from '../auth/AuthContext';
import { getErrorMessage } from '../lib/utils';

export function LoginPage() {
  const { user, loading, login, verify2fa } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [pendingToken, setPendingToken] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (!loading && user) {
    return <Navigate to="/dashboard" replace />;
  }

  const onLogin = async (e: FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const session = await login(email.trim(), password);
      if (session.requires2fa && session.pendingToken) {
        setPendingToken(session.pendingToken);
        toast.success('Enter your 2FA code');
      } else {
        toast.success('Welcome back');
        navigate('/dashboard', { replace: true });
      }
    } catch (err) {
      toast.error(getErrorMessage(err, 'Login failed'));
    } finally {
      setSubmitting(false);
    }
  };

  const onVerify = async (e: FormEvent) => {
    e.preventDefault();
    if (!pendingToken) return;
    setSubmitting(true);
    try {
      await verify2fa(pendingToken, code.trim());
      toast.success('Welcome back');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      toast.error(getErrorMessage(err, 'Invalid 2FA code'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            'radial-gradient(ellipse at 20% 20%, rgba(0,210,255,0.18), transparent 50%), radial-gradient(ellipse at 80% 80%, rgba(142,45,226,0.16), transparent 50%)',
        }}
      />

      <div className="relative w-full max-w-md rounded-2xl border border-border bg-surface/90 p-8 shadow-2xl backdrop-blur">
        <div className="mb-8 text-center">
          <img src="/favicon.png" alt="MastPlayer" className="mx-auto mb-3 h-12 w-12 rounded-xl" />
          <h1 className="font-display text-2xl font-bold brand-gradient-text">MastPlayer Admin</h1>
          <p className="mt-1 text-sm text-muted">
            {pendingToken ? 'Two-factor authentication' : 'Sign in to continue'}
          </p>
        </div>

        {!pendingToken ? (
          <form onSubmit={onLogin} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Email</span>
              <input
                type="email"
                autoComplete="username"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--input-focus-ring)]"
              />
            </label>
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Password</span>
              <input
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-sm outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--input-focus-ring)]"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="brand-gradient-bg w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Signing in…' : 'Sign in'}
            </button>
          </form>
        ) : (
          <form onSubmit={onVerify} className="space-y-4">
            <label className="block">
              <span className="mb-1.5 block text-sm font-medium">Authentication code</span>
              <input
                type="text"
                inputMode="numeric"
                autoComplete="one-time-code"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="000000"
                className="w-full rounded-lg border border-border bg-background px-3 py-2.5 text-center text-lg tracking-[0.3em] outline-none focus:border-[var(--border-accent)] focus:ring-2 focus:ring-[var(--input-focus-ring)]"
              />
            </label>
            <button
              type="submit"
              disabled={submitting}
              className="brand-gradient-bg w-full rounded-lg py-2.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {submitting ? 'Verifying…' : 'Verify'}
            </button>
            <button
              type="button"
              className="w-full text-sm text-muted hover:text-foreground"
              onClick={() => {
                setPendingToken(null);
                setCode('');
              }}
            >
              Back to login
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
