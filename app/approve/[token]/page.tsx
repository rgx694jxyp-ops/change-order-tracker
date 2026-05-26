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
  company?: {
    name: string | null;
    phone: string | null;
    email: string | null;
    address: string | null;
  } | null;
  companies?: {
    name: string | null;
    phone: string | null;
    email: string | null;
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

function formatDate(value: string | null | undefined) {
  if (!value) {
    return '—';
  }

  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '—';
  }

  return parsed.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

function safeText(value: string | null | undefined) {
  return value && value.trim().length > 0 ? value : '—';
}

function formatStatus(value: string | null | undefined) {
  const normalized = safeText(value);
  return normalized === '—' ? normalized : normalized.replace(/_/g, ' ');
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

  const companyInfo = changeOrder.company ?? changeOrder.companies ?? null;
  const hasCompanyInfo = Boolean(
    companyInfo &&
      (companyInfo.name || companyInfo.address || companyInfo.phone || companyInfo.email)
  );

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6">
      <div className="mx-auto max-w-4xl space-y-6">
        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm sm:p-8">
          <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-500">
            Change Order Approval
          </p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-900">
            {safeText(changeOrder.title)}
          </h1>

          {hasCompanyInfo ? (
            <div className="mt-5 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              <p className="font-semibold text-slate-900">{safeText(companyInfo?.name)}</p>
              {companyInfo?.address ? (
                <p className="mt-1 whitespace-pre-line text-slate-600">{safeText(companyInfo.address)}</p>
              ) : null}
              <div className="mt-1 flex flex-wrap gap-x-3 gap-y-1 text-slate-600">
                {companyInfo?.phone ? <span>{safeText(companyInfo.phone)}</span> : null}
                {companyInfo?.email ? <span>{safeText(companyInfo.email)}</span> : null}
              </div>
            </div>
          ) : null}

          <dl className="mt-6 grid gap-4 text-sm sm:grid-cols-3">
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">
                Change Order #
              </dt>
              <dd className="mt-1 font-medium text-slate-800">
                {safeText(changeOrder.change_order_number)}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Status</dt>
              <dd className="mt-1 font-medium capitalize text-slate-800">
                {formatStatus(changeOrder.status)}
              </dd>
            </div>
            <div className="rounded-md border border-slate-200 bg-white px-3 py-2">
              <dt className="text-xs font-semibold uppercase tracking-wide text-slate-500">Created</dt>
              <dd className="mt-1 font-medium text-slate-800">{formatDate(changeOrder.created_at)}</dd>
            </div>
          </dl>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Customer Information</h2>
            <dl className="mt-4 space-y-2 text-sm text-slate-700">
              <div>
                <dt className="font-medium text-slate-500">Customer name</dt>
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
            </dl>
          </div>

          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Job Information</h2>
            <dl className="mt-4 space-y-2 text-sm text-slate-700">
              <div>
                <dt className="font-medium text-slate-500">Job name</dt>
                <dd>{safeText(changeOrder.jobs?.name)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Job number</dt>
                <dd>{safeText(changeOrder.jobs?.job_number)}</dd>
              </div>
              <div>
                <dt className="font-medium text-slate-500">Job address</dt>
                <dd className="whitespace-pre-line">{safeText(changeOrder.jobs?.address)}</dd>
              </div>
            </dl>
          </div>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Description</h2>
          <p className="mt-3 whitespace-pre-line text-sm text-slate-700">
            {safeText(changeOrder.description)}
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-semibold text-slate-900">Cost Breakdown</h2>

          <dl className="mt-4 divide-y divide-slate-200 rounded-lg border border-slate-200 bg-white">
            <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
              <dt>Labor</dt>
              <dd className="font-medium">{formatMoney(changeOrder.labor_cost)}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
              <dt>Materials</dt>
              <dd className="font-medium">{formatMoney(changeOrder.material_cost)}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
              <dt>Other</dt>
              <dd className="font-medium">{formatMoney(changeOrder.other_cost)}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
              <dt>Subtotal</dt>
              <dd className="font-medium">{formatMoney(changeOrder.subtotal)}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
              <dt>Markup</dt>
              <dd className="font-medium">{formatMoney(changeOrder.markup_amount)}</dd>
            </div>
            <div className="flex items-center justify-between px-4 py-3 text-sm text-slate-700">
              <dt>Tax</dt>
              <dd className="font-medium">{formatMoney(changeOrder.tax_amount)}</dd>
            </div>
            <div className="flex items-center justify-between bg-slate-900 px-4 py-3 text-sm text-white">
              <dt className="font-semibold">Total</dt>
              <dd className="text-lg font-semibold">{formatMoney(changeOrder.total_amount)}</dd>
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
