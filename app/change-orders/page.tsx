import { AppShell } from '@/components/app-shell';

export default function ChangeOrdersPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Change Orders
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
              Track draft, sent, approved, rejected, and invoiced change orders
              in one place.
            </p>
          </div>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex items-center rounded-md border border-slate-300 bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500 opacity-80"
          >
            New Change Order
          </button>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">
            No change orders yet
          </h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Change orders will appear here once you start tracking extra work.
          </p>
          <p className="mt-4 text-xs text-slate-500 sm:text-sm">
            Change order forms and calculations will be added after customers and
            jobs are working.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
