import { AppShell } from '@/components/app-shell';

const setupItems = [
  'Company profile',
  'Default markup percentage',
  'Default tax percentage',
  'PDF template details',
];

export default function SettingsPage() {
  return (
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
                key={item}
                className="flex items-center justify-between px-4 py-3 text-sm text-slate-700"
              >
                <span>{item}</span>
                <span className="rounded-full border border-slate-300 bg-white px-2 py-0.5 text-xs text-slate-500">
                  Placeholder
                </span>
              </li>
            ))}
          </ul>

          <p className="mt-4 text-xs text-slate-500 sm:text-sm">
            Settings forms will be added after the core customer, job, and change
            order workflow is working.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
