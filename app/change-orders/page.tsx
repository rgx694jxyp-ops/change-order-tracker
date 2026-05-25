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

        <ChangeOrderForm />

        <ChangeOrderList />
      </div>
    </AppShell>
  );
}
