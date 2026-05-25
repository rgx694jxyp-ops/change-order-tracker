import { AppShell } from '@/components/app-shell';
import { ChangeOrderForm } from '@/components/change-order-form';
import { ChangeOrderList } from '@/components/change-order-list';

export default function ChangeOrdersPage() {
  return (
    <AppShell>
      <div className="mx-auto w-full max-w-5xl space-y-6">
        <header>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
            Change Orders
          </h1>
          <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
            Track draft, sent, approved, rejected, and invoiced change orders in
            one place.
          </p>
        </header>

        <section className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">MVP workflow</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm text-slate-700 sm:text-base">
            <li>Create a draft change order.</li>
            <li>Generate an approval link from the change order card.</li>
            <li>Send or copy the approval link to the customer or GC.</li>
            <li>Customer approves or rejects from the public approval page.</li>
            <li>Export approved work from the dashboard for billing.</li>
          </ol>
        </section>

        <ChangeOrderForm />

        <ChangeOrderList />
      </div>
    </AppShell>
  );
}
