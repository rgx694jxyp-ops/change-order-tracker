import { AppShell } from '@/components/app-shell';
import CompanyRequiredGuard from '@/components/company-required-guard';
import { DashboardSummary } from '@/components/dashboard-summary';

export default function DashboardPage() {
  return (
    <CompanyRequiredGuard>
      <AppShell>
        <div className="mx-auto w-full max-w-6xl space-y-8">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Dashboard
            </h1>
            <p className="mt-2 text-sm text-slate-600 sm:text-base">
              Track change orders, approvals, and unbilled work from one place.
            </p>
            <a
              href="/api/export/change-orders"
              className="mt-4 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              Export Change Orders CSV
            </a>
          </header>

          <DashboardSummary />
        </div>
      </AppShell>
    </CompanyRequiredGuard>
  );
}
