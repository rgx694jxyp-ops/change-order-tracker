import { AppShell } from '@/components/app-shell';

export default function JobsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Jobs
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
              Organize change orders by project so costs, approvals, and billing
              stay tied to the right job.
            </p>
          </div>

          <button
            type="button"
            disabled
            aria-disabled="true"
            className="inline-flex items-center rounded-md border border-slate-300 bg-slate-200 px-4 py-2 text-sm font-medium text-slate-500 opacity-80"
          >
            New Job
          </button>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">No jobs yet</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Jobs will appear here once you start adding customer projects.
          </p>
          <p className="mt-4 text-xs text-slate-500 sm:text-sm">
            Job forms will be added in the next milestone.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
