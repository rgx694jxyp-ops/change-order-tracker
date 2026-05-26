"use client";

import { Suspense, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

function isSafeInternalPath(path: string | null | undefined): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen items-center justify-center bg-slate-50 text-slate-600">
          Loading login...
        </div>
      }
    >
      <LoginFormContent />
    </Suspense>
  );
}

function LoginFormContent() {
  const searchParams = useSearchParams();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  async function waitForServerAuth() {
    for (let attempt = 0; attempt < 10; attempt += 1) {
      const response = await fetch('/api/auth/me', {
        credentials: 'same-origin',
        cache: 'no-store',
      });

      const result = await response.json();

      if (response.ok && result?.authenticated === true) {
        return true;
      }

      await new Promise((resolve) => window.setTimeout(resolve, 150));
    }

    return false;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErrorMessage('');

    const nextParam = searchParams.get('next');
    const redirectTarget = isSafeInternalPath(nextParam) ? nextParam : '/dashboard';

    const response = await fetch('/api/auth/sign-in', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      credentials: 'same-origin',
      cache: 'no-store',
      redirect: 'manual',
      body: JSON.stringify({
        email,
        password,
        next: redirectTarget,
      }),
    });

    if (response.status === 303 || response.type === 'opaqueredirect') {
      const isAuthenticated = await waitForServerAuth();
      if (!isAuthenticated) {
        setErrorMessage('Signed in, but the session was not ready. Please try again.');
        setLoading(false);
        return;
      }

      window.location.assign(redirectTarget);
      return;
    }

    if (response.redirected) {
      const isAuthenticated = await waitForServerAuth();
      if (!isAuthenticated) {
        setErrorMessage('Signed in, but the session was not ready. Please try again.');
        setLoading(false);
        return;
      }

      window.location.assign(redirectTarget);
      return;
    }

    const result = (await response.json()) as {
      ok?: boolean;
      message?: string;
    };

    if (!response.ok || !result.ok) {
      setErrorMessage(result.message || 'Unable to sign in.');
      setLoading(false);
      return;
    }

    const isAuthenticated = await waitForServerAuth();
    if (!isAuthenticated) {
      setErrorMessage('Signed in, but the session was not ready. Please try again.');
      setLoading(false);
      return;
    }

    window.location.assign(redirectTarget);
  }

  return (
    <main className="min-h-screen bg-slate-950 px-6 py-12 text-slate-100">
      <div className="mx-auto flex min-h-[calc(100vh-6rem)] max-w-md items-center justify-center">
        <div className="w-full rounded-3xl border border-white/10 bg-white/5 p-8 shadow-2xl shadow-black/30 backdrop-blur">
          <div className="mb-8 text-center">
            <h1 className="text-3xl font-semibold tracking-tight">Sign in</h1>
            <p className="mt-2 text-sm text-slate-300">
              Sign in to manage your change orders.
            </p>
          </div>

          <form className="space-y-4" onSubmit={handleSubmit}>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="email">
                Email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                placeholder="name@company.com"
                autoComplete="email"
                required
              />
            </div>

            <div>
              <label className="mb-2 block text-sm font-medium text-slate-200" htmlFor="password">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-900/80 px-4 py-3 text-slate-100 outline-none transition placeholder:text-slate-500 focus:border-cyan-400 focus:ring-2 focus:ring-cyan-400/30"
                placeholder="••••••••"
                autoComplete="current-password"
                required
              />
            </div>

            {errorMessage ? (
              <p className="rounded-xl border border-rose-500/30 bg-rose-500/10 px-4 py-3 text-sm text-rose-200">
                {errorMessage}
              </p>
            ) : null}

            <button
              type="submit"
              disabled={loading}
              className="inline-flex w-full items-center justify-center rounded-xl bg-cyan-400 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-300 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {loading ? 'Signing in...' : 'Sign in'}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-300">
            Need an account?{' '}
            <Link className="font-medium text-cyan-300 transition hover:text-cyan-200" href="/signup">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </main>
  );
}
