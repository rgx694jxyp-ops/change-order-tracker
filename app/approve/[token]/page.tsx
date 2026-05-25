"use client";

import { useEffect, useState } from 'react';

type ChangeOrderApproval = {
  id: string;
  change_order_number: string | null;
  title: string;
  description: string | null;
  labor_cost: number | string | null;
  material_cost: number | string | null;
  other_cost: number | string | null;
  markup_percent: number | string | null;
  tax_percent: number | string | null;
  subtotal: number | string | null;
  markup_amount: number | string | null;
  tax_amount: number | string | null;
  total_amount: number | string | null;
  status: string;
  sent_at: string | null;
  approved_at: string | null;
  rejected_at: string | null;
  created_at: string;
  customers?: {
    name: string | null;
    contact_name: string | null;
    email: string | null;
    phone: string | null;
    billing_address: string | null;
  } | null;
  jobs?: {
    name: string | null;
    job_number: string | null;
    address: string | null;
  } | null;
};

type ApprovalFetchResponse = {
  ok?: boolean;
  message?: string;
  change_order?: ChangeOrderApproval;
};

type ApprovalDecisionResponse = {
  ok?: boolean;
  message?: string;
  change_order?: ChangeOrderApproval;
};

type ApprovalPageProps = {
  params: Promise<{ token: string }> | { token: string };
};

const usdFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatMoney(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  return usdFormatter.format(Number.isFinite(parsed) ? parsed : 0);
}

function safeText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : 'N/A';
}

export default function ApprovalPage({ params }: ApprovalPageProps) {
  const [token, setToken] = useState('');
  const [changeOrder, setChangeOrder] = useState<ChangeOrderApproval | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [actionMessage, setActionMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function resolveAndLoad() {
      try {
        const resolved = await Promise.resolve(params);

        if (!isMounted) {
          return;
        }

        const resolvedToken = resolved.token ?? '';

        if (!resolvedToken) {
          setErrorMessage('Approval link not found');
          setIsLoading(false);
          return;
        }

        setToken(resolvedToken);

        const response = await fetch(`/api/approvals/${resolvedToken}`);
        const result = (await response.json()) as ApprovalFetchResponse;

        if (!response.ok) {
          setErrorMessage(result.message ?? 'Something went wrong loading this approval request.');
          setIsLoading(false);
          return;
        }

        setChangeOrder(result.change_order ?? null);
      } catch {
        if (!isMounted) {
          return;
        }

        setErrorMessage('Something went wrong loading this approval request.');
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    resolveAndLoad();

    return () => {
      isMounted = false;
    };
  }, [params]);

  async function submitDecision(decision: 'approved' | 'rejected') {
    if (!token) {
      return;
    }

    setIsSubmitting(true);
    setActionMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch(`/api/approvals/${token}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ decision }),
      });

      const result = (await response.json()) as ApprovalDecisionResponse;

      if (!response.ok) {
        setErrorMessage(result.message ?? 'Something went wrong submitting this decision.');
        return;
      }

      if (result.change_order) {
        setChangeOrder(result.change_order);
      }

      setActionMessage(result.message ?? null);
    } catch {
      setErrorMessage('Something went wrong submitting this decision.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Loading approval request...
        </div>
      </main>
    );
  }

  if (errorMessage && !changeOrder) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
          {errorMessage}
        </div>
      </main>
    );
  }

  if (!changeOrder) {
    return (
      <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
        <div className="mx-auto max-w-3xl rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          Approval link not found
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">
            Change Order Approval
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-slate-900">
            Demo Contractor
          </h1>

          <dl className="mt-6 grid gap-3 text-sm text-slate-700 sm:grid-cols-2">
            <div>
              <dt className="font-medium text-slate-500">Change Order Number</dt>
              <dd>{safeText(changeOrder.change_order_number)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Status</dt>
              <dd className="capitalize">{safeText(changeOrder.status)}</dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="font-medium text-slate-500">Title</dt>
              <dd>{safeText(changeOrder.title)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Customer</h2>
          <dl className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              <dt className="font-medium text-slate-500">Name</dt>
              <dd>{safeText(changeOrder.customers?.name)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Contact</dt>
              <dd>{safeText(changeOrder.customers?.contact_name)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Email</dt>
              <dd>{safeText(changeOrder.customers?.email)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Phone</dt>
              <dd>{safeText(changeOrder.customers?.phone)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Billing Address</dt>
              <dd className="whitespace-pre-line">{safeText(changeOrder.customers?.billing_address)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Job</h2>
          <dl className="mt-4 space-y-2 text-sm text-slate-700">
            <div>
              <dt className="font-medium text-slate-500">Name</dt>
              <dd>{safeText(changeOrder.jobs?.name)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Job Number</dt>
              <dd>{safeText(changeOrder.jobs?.job_number)}</dd>
            </div>
            <div>
              <dt className="font-medium text-slate-500">Address</dt>
              <dd className="whitespace-pre-line">{safeText(changeOrder.jobs?.address)}</dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Description</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
            {safeText(changeOrder.description)}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Cost Breakdown</h2>

          <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt>Labor</dt>
              <dd className="font-medium">{formatMoney(changeOrder.labor_cost)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt>Materials</dt>
              <dd className="font-medium">{formatMoney(changeOrder.material_cost)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt>Other</dt>
              <dd className="font-medium">{formatMoney(changeOrder.other_cost)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt>Subtotal</dt>
              <dd className="font-medium">{formatMoney(changeOrder.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt>Markup</dt>
              <dd className="font-medium">{formatMoney(changeOrder.markup_amount)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-50 px-3 py-2">
              <dt>Tax</dt>
              <dd className="font-medium">{formatMoney(changeOrder.tax_amount)}</dd>
            </div>
            <div className="flex items-center justify-between rounded-md bg-slate-100 px-3 py-2 sm:col-span-2">
              <dt>Total</dt>
              <dd className="text-base font-semibold text-slate-900">
                {formatMoney(changeOrder.total_amount)}
              </dd>
            </div>
          </dl>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          {changeOrder.status === 'sent' ? (
            <div className="space-y-4">
              <p className="text-sm text-slate-700">
                Please review this change order and choose your decision.
              </p>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() => void submitDecision('approved')}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-md bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : 'Approve Change Order'}
                </button>
                <button
                  type="button"
                  onClick={() => void submitDecision('rejected')}
                  disabled={isSubmitting}
                  className="inline-flex items-center justify-center rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-rose-500 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isSubmitting ? 'Submitting...' : 'Reject Change Order'}
                </button>
              </div>
            </div>
          ) : null}

          {changeOrder.status === 'approved' ? (
            <p className="text-sm font-medium text-emerald-700">
              This change order has been approved.
            </p>
          ) : null}

          {changeOrder.status === 'rejected' ? (
            <p className="text-sm font-medium text-rose-700">
              This change order has been rejected.
            </p>
          ) : null}

          {changeOrder.status === 'invoiced' ? (
            <p className="text-sm font-medium text-slate-700">
              This change order has already been invoiced.
            </p>
          ) : null}

          {actionMessage ? <p className="mt-3 text-sm text-emerald-700">{actionMessage}</p> : null}
          {errorMessage ? <p className="mt-3 text-sm text-rose-700">{errorMessage}</p> : null}
        </section>
      </div>
    </main>
  );
}
