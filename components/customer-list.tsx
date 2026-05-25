"use client";

import { useEffect, useState } from 'react';

type Customer = {
  id: string;
  name: string;
  contact_name: string | null;
  email: string | null;
  phone: string | null;
  billing_address: string | null;
  notes: string | null;
  created_at: string;
};

type CustomersResponse = {
  ok?: boolean;
  message?: string;
  customers?: Customer[];
};

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadCustomers() {
      try {
        const response = await fetch('/api/customers');
        const result = (await response.json()) as CustomersResponse;

        if (!response.ok) {
          if (isMounted) {
            setErrorMessage(result.message ?? 'Something went wrong loading customers.');
          }
          return;
        }

        if (isMounted) {
          setCustomers(result.customers ?? []);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Something went wrong loading customers.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadCustomers();

    return () => {
      isMounted = false;
    };
  }, []);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading customers...
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

  if (customers.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">No customers yet</h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Customers will appear here once you start adding them.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {customers.map((customer) => (
        <article
          key={customer.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <h2 className="text-lg font-semibold text-slate-900">{customer.name}</h2>

          <dl className="mt-4 space-y-3 text-sm text-slate-600">
            {customer.contact_name ? (
              <div>
                <dt className="font-medium text-slate-700">Contact</dt>
                <dd>{customer.contact_name}</dd>
              </div>
            ) : null}

            {customer.email ? (
              <div>
                <dt className="font-medium text-slate-700">Email</dt>
                <dd>{customer.email}</dd>
              </div>
            ) : null}

            {customer.phone ? (
              <div>
                <dt className="font-medium text-slate-700">Phone</dt>
                <dd>{customer.phone}</dd>
              </div>
            ) : null}

            {customer.billing_address ? (
              <div>
                <dt className="font-medium text-slate-700">Billing Address</dt>
                <dd className="whitespace-pre-line">{customer.billing_address}</dd>
              </div>
            ) : null}

            {customer.notes ? (
              <div>
                <dt className="font-medium text-slate-700">Notes</dt>
                <dd className="whitespace-pre-line">{customer.notes}</dd>
              </div>
            ) : null}
          </dl>
        </article>
      ))}
    </div>
  );
}
