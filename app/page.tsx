import Link from 'next/link';
import { supabase } from '@/lib/supabase/client';

export default function HomePage() {
  const supabaseConfigured = Boolean(supabase);

  return (
    <main className="min-h-screen bg-slate-950 text-white">
      <section className="mx-auto flex min-h-screen max-w-5xl flex-col items-center justify-center px-6 py-16 text-center">
        {supabaseConfigured && (
          <div className="mb-4 rounded-full border border-emerald-700/60 bg-emerald-900/30 px-3 py-1 text-xs text-emerald-300">
            Supabase client configured
          </div>
        )}

        <div className="mb-6 rounded-full border border-slate-700 bg-slate-900 px-4 py-2 text-sm text-slate-300">
          Change Order & Job Cost Tracker
        </div>

        <h1 className="max-w-3xl text-4xl font-bold tracking-tight sm:text-6xl">
          Stop losing money on unapproved change orders.
        </h1>

        <p className="mt-6 max-w-2xl text-lg leading-8 text-slate-300">
          Track customers, jobs, change orders, approvals, PDFs, attachments,
          and CSV exports from one simple workflow.
        </p>

        <p className="mt-3 text-sm text-slate-400">
          MVP workflow is active: create, approve, attach, export.
        </p>

        <Link
          href="/dashboard"
          className="mt-8 inline-flex items-center rounded-md bg-emerald-500 px-5 py-3 text-sm font-semibold text-slate-950 transition-colors hover:bg-emerald-400"
        >
          Open Dashboard
        </Link>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left">
            <h2 className="font-semibold text-white">Track</h2>
            <p className="mt-2 text-sm text-slate-400">
              Customers, jobs, costs, markups, tax, and change order status.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left">
            <h2 className="font-semibold text-white">Approve</h2>
            <p className="mt-2 text-sm text-slate-400">
              Generate public approval links and let customers approve or reject
              online.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left">
            <h2 className="font-semibold text-white">Bill</h2>
            <p className="mt-2 text-sm text-slate-400">
              Export change orders to CSV and spot approved work before it gets
              missed.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}