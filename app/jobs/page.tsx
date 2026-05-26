import { AppShell } from '@/components/app-shell';
import CompanyRequiredGuard from '@/components/company-required-guard';
import { JobForm } from '@/components/job-form';
import { JobList } from '@/components/job-list';

export default function JobsPage() {
  return (
    <CompanyRequiredGuard>
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

          <JobList />
        </div>
      </AppShell>
    </CompanyRequiredGuard>
  );
}
