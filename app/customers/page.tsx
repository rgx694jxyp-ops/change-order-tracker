import { AppShell } from '@/components/app-shell';
import CompanyRequiredGuard from '@/components/company-required-guard';
import { CustomerForm } from '@/components/customer-form';
import { CustomerList } from '@/components/customer-list';

export default function CustomersPage() {
  return (
    <CompanyRequiredGuard>
      <AppShell>
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Customers
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
              Store customer and GC contact details so every change order is tied
              to the right customer.
            </p>
          </header>

          <CustomerForm />

          <CustomerList />
        </div>
      </AppShell>
    </CompanyRequiredGuard>
  );
}
