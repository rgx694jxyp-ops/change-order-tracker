"use client";

import { useEffect, useState } from 'react';

type ChangeOrder = {
  id: string;
  change_order_number: string | null;
  title: string;
  description: string | null;
  labor_cost: number;
  material_cost: number;
  other_cost: number;
  markup_percent: number;
  tax_percent: number;
  subtotal: number;
  markup_amount: number;
  tax_amount: number;
  total_amount: number;
  status: string;
  created_at: string;
  customers?: { name: string } | null;
  jobs?: { name: string } | null;
};

type ChangeOrdersResponse = {
  ok?: boolean;
  message?: string;
  change_orders?: ChangeOrder[];
};

const currencyFormatter = new Intl.NumberFormat('en-US', {
  style: 'currency',
  currency: 'USD',
});

function formatMoney(value: number) {
  return currencyFormatter.format(value ?? 0);
}

export function ChangeOrderList() {
  const [changeOrders, setChangeOrders] = useState<ChangeOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadChangeOrders() {
      try {
        const response = await fetch('/api/change-orders');
        const result = (await response.json()) as ChangeOrdersResponse;

        if (!response.ok) {
          if (isMounted) {
            setErrorMessage(
              result.message ?? 'Something went wrong loading change orders.'
            );
          }
          return;
        }

        if (isMounted) {
          setChangeOrders(result.change_orders ?? []);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Something went wrong loading change orders.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadChangeOrders();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading change orders...
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

  if (changeOrders.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">No change orders yet</h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Change orders will appear here once you start tracking extra work.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {changeOrders.map((changeOrder) => (
        <article
          key={changeOrder.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              {changeOrder.change_order_number ? (
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500">
                  {changeOrder.change_order_number}
                </p>
              ) : null}
              <h2 className="mt-1 text-lg font-semibold text-slate-900">
                {changeOrder.title}
              </h2>
              {changeOrder.customers?.name ? (
                <p className="mt-1 text-sm text-slate-500">
                  Customer: {changeOrder.customers.name}
                </p>
              ) : null}
              {changeOrder.jobs?.name ? (
                <p className="text-sm text-slate-500">Job: {changeOrder.jobs.name}</p>
              ) : null}
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
              {changeOrder.status}
            </span>
          </div>

          {changeOrder.description ? (
            <p className="mt-4 whitespace-pre-line text-sm text-slate-600">
              {changeOrder.description}
            </p>
          ) : null}

          <dl className="mt-4 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
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
            <div className="flex items-center justify-between rounded-md bg-slate-100 px-3 py-2">
              <dt>Total</dt>
              <dd className="font-semibold text-slate-900">
                {formatMoney(changeOrder.total_amount)}
              </dd>
            </div>
          </dl>
        </article>
      ))}
    </div>
  );
}
