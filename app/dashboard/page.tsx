import { AppShell } from '@/components/app-shell';

export default function DashboardPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-6xl space-y-8">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Dashboard
          </h1>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Track change orders, approvals, and unbilled work from one place.
          </p>
        </header>

        <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Pending Approval</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">$0</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Approved Not Invoiced</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">$0</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Rejected</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">$0</p>
          </article>

          <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-sm text-slate-500">Total Change Orders</p>
            <p className="mt-2 text-2xl font-semibold text-slate-900">0</p>
          </article>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            No activity yet. Create your first customer, job, and change order to
            get started.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
