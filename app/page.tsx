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
          A simple tool for small contractors to track change orders, job costs,
          approvals, and unbilled work without relying on messy spreadsheets.
        </p>

        <div className="mt-10 grid w-full max-w-3xl gap-4 sm:grid-cols-3">
          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left">
            <h2 className="font-semibold text-white">Track</h2>
            <p className="mt-2 text-sm text-slate-400">
              Keep every change order tied to the right customer and job.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left">
            <h2 className="font-semibold text-white">Approve</h2>
            <p className="mt-2 text-sm text-slate-400">
              Send approval links so customers can approve work faster.
            </p>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900 p-5 text-left">
            <h2 className="font-semibold text-white">Bill</h2>
            <p className="mt-2 text-sm text-slate-400">
              See approved but unbilled work before money gets forgotten.
            </p>
          </div>
        </div>
      </section>
    </main>
  );
}