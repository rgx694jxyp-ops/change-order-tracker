import { AppShell } from '@/components/app-shell';
import { CustomerForm } from '@/components/customer-form';

export default function CustomersPage() {
  return (
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

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">No customers yet</h2>
          <p className="mt-2 text-sm text-slate-600 sm:text-base">
            Customers will appear here once you start adding them.
          </p>
        </section>
      </div>
    </AppShell>
  );
}
