import { AppShell } from '@/components/app-shell';
import { DashboardSummary } from '@/components/dashboard-summary';

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

        <DashboardSummary />
      </div>
    </AppShell>
  );
}
