"use client";

import { useEffect, useState } from 'react';

type RecentChangeOrder = {
  id: string;
  status: string;
  total_amount: number;
  created_at: string | null;
};

type DashboardSummaryData = {
  pendingApprovalAmount: number;
  approvedNotInvoicedAmount: number;
  rejectedAmount: number;
  totalChangeOrders: number;
  totalDraftAmount: number;
  totalChangeOrderAmount: number;
  recentChangeOrders: RecentChangeOrder[];
};

type DashboardSummaryResponse = {
  ok?: boolean;
  message?: string;
  summary?: DashboardSummaryData;
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatUSD(value: number) {
  return currencyFormatter.format(value ?? 0);
}

function formatDateTime(value: string | null) {
  if (!value) {
    return 'Unknown date';
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return 'Unknown date';
  }

  return date.toLocaleString();
}

export function DashboardSummary() {
  const [summary, setSummary] = useState<DashboardSummaryData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadSummary() {
      try {
        const response = await fetch('/api/dashboard/summary');
        const result = (await response.json()) as DashboardSummaryResponse;

        if (!response.ok) {
          if (isMounted) {
            setErrorMessage(result.message ?? 'Something went wrong loading the dashboard summary.');
          }
          return;
        }

        if (isMounted) {
          setSummary(result.summary ?? null);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Something went wrong loading the dashboard summary.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadSummary();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading dashboard summary...
      </div>
    );
  }

  if (errorMessage) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
        {errorMessage}
      </div>
    );
  }

  if (!summary) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        No summary data available.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Pending Approval</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatUSD(summary.pendingApprovalAmount)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Approved Not Invoiced</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatUSD(summary.approvedNotInvoicedAmount)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Rejected</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatUSD(summary.rejectedAmount)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Change Orders</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {summary.totalChangeOrders}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Draft Value</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatUSD(summary.totalDraftAmount)}
          </p>
        </article>

        <article className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Change Order Value</p>
          <p className="mt-2 text-2xl font-semibold text-slate-900">
            {formatUSD(summary.totalChangeOrderAmount)}
          </p>
        </article>
      </section>

      <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">Recent Activity</h2>

        {summary.recentChangeOrders.length === 0 ? (
          <p className="mt-3 text-sm text-slate-600 sm:text-base">
            No activity yet. Create your first customer, job, and change order to
            get started.
          </p>
        ) : (
          <div className="mt-4 space-y-3">
            {summary.recentChangeOrders.slice(0, 5).map((changeOrder) => (
              <article
                key={changeOrder.id}
                className="rounded-lg border border-slate-200 bg-slate-50 p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm font-medium capitalize text-slate-800">
                      {changeOrder.status}
                    </p>
                    <p className="mt-1 text-xs text-slate-500">
                      {formatDateTime(changeOrder.created_at)}
                    </p>
                  </div>
                  <p className="text-sm font-semibold text-slate-900">
                    {formatUSD(changeOrder.total_amount)}
                  </p>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
