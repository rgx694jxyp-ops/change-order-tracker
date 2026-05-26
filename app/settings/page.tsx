import { AppShell } from '@/components/app-shell';
import CompanyRequiredGuard from '@/components/company-required-guard';

const setupItems = [
  { label: 'Company name', value: 'Demo Contractor' },
  { label: 'Default markup percentage', value: '15%' },
  { label: 'Default tax percentage', value: '0%' },
  { label: 'Attachment storage', value: 'Supabase Storage' },
  { label: 'Approval links', value: 'Public token links' },
  { label: 'CSV export', value: 'Enabled' },
];

export default function SettingsPage() {
  return (
    <CompanyRequiredGuard>
      <AppShell>
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
              Manage company defaults used for change orders, job costing, and
              approvals.
            </p>
          </header>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Company setup</h2>

            <ul className="mt-4 divide-y divide-slate-200 rounded-md border border-slate-200 bg-slate-50">
              {setupItems.map((item) => (
                <li
                  key={item.label}
                  className="flex items-center justify-between px-4 py-3 text-sm text-slate-700"
                >
                  <span className="font-medium text-slate-700">{item.label}</span>
                  <span className="text-right text-slate-600">{item.value}</span>
                </li>
              ))}
            </ul>

            <p className="mt-4 text-xs text-slate-500 sm:text-sm">
              Company profile editing, authentication, and billing settings will be
              added after the MVP workflow is complete.
            </p>
          </section>
        </div>
      </AppShell>
    </CompanyRequiredGuard>
  );
}
