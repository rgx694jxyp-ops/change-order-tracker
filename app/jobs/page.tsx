import { AppShell } from '@/components/app-shell';
import { JobForm } from '@/components/job-form';

export default function JobsPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Jobs
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Organize change orders by project so costs, approvals, and billing
            stay tied to the right job.
          </p>
        </header>

        <JobForm />

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
