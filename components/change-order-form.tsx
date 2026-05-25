"use client";

import { useEffect, useMemo, useState } from 'react';

type Customer = {
  id: string;
  name: string;
};

type Job = {
  id: string;
  customer_id: string;
  name: string;
  job_number?: string | null;
  customers?: { name: string } | null;
};

type CustomersResponse = {
  ok?: boolean;
  message?: string;
  customers?: Customer[];
};

type JobsResponse = {
  ok?: boolean;
  message?: string;
  jobs?: Job[];
};

type CreateChangeOrderResponse = {
  ok?: boolean;
  message?: string;
};

type FormState = {
  customer_id: string;
  job_id: string;
  change_order_number: string;
  title: string;
  description: string;
  labor_cost: string;
  material_cost: string;
  other_cost: string;
  markup_percent: string;
  tax_percent: string;
  status: 'draft' | 'sent' | 'approved' | 'rejected' | 'invoiced';
};

const initialFormState: FormState = {
  customer_id: '',
  job_id: '',
  change_order_number: '',
  title: '',
  description: '',
  labor_cost: '0',
  material_cost: '0',
  other_cost: '0',
  markup_percent: '0',
  tax_percent: '0',
  status: 'draft',
};

function parseNumber(value: string) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}

export function ChangeOrderForm() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadingError, setLoadingError] = useState<string | null>(null);

  const [formData, setFormData] = useState<FormState>(initialFormState);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [customersResponse, jobsResponse] = await Promise.all([
          fetch('/api/customers'),
          fetch('/api/jobs'),
        ]);

        const customersResult = (await customersResponse.json()) as CustomersResponse;
        const jobsResult = (await jobsResponse.json()) as JobsResponse;

        if (!customersResponse.ok) {
          if (isMounted) {
            setLoadingError(
              customersResult.message ?? 'Something went wrong loading customers.'
            );
          }
          return;
        }

        if (!jobsResponse.ok) {
          if (isMounted) {
            setLoadingError(jobsResult.message ?? 'Something went wrong loading jobs.');
          }
          return;
        }

        if (isMounted) {
          setCustomers(customersResult.customers ?? []);
          setJobs(jobsResult.jobs ?? []);
        }
      } catch {
        if (isMounted) {
          setLoadingError('Something went wrong loading form data.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    loadData();

    return () => {
      isMounted = false;
    };
  }, []);

  const filteredJobs = useMemo(() => {
    if (!formData.customer_id) {
      return jobs;
    }

    return jobs.filter((job) => job.customer_id === formData.customer_id);
  }, [jobs, formData.customer_id]);

  const totals = useMemo(() => {
    const laborCost = parseNumber(formData.labor_cost);
    const materialCost = parseNumber(formData.material_cost);
    const otherCost = parseNumber(formData.other_cost);
    const markupPercent = parseNumber(formData.markup_percent);
    const taxPercent = parseNumber(formData.tax_percent);

    const subtotal = laborCost + materialCost + otherCost;
    const markupAmount = subtotal * (markupPercent / 100);
    const taxableAmount = subtotal + markupAmount;
    const taxAmount = taxableAmount * (taxPercent / 100);
    const totalAmount = subtotal + markupAmount + taxAmount;

    return {
      subtotal,
      markupAmount,
      taxAmount,
      totalAmount,
    };
  }, [
    formData.labor_cost,
    formData.material_cost,
    formData.other_cost,
    formData.markup_percent,
    formData.tax_percent,
  ]);

  function handleChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;

    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  }

  function handleCustomerChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const nextCustomerId = event.target.value;

    setFormData((current) => {
      const selectedJobBelongsToCustomer = jobs.some(
        (job) => job.id === current.job_id && job.customer_id === nextCustomerId
      );

      return {
        ...current,
        customer_id: nextCustomerId,
        job_id: selectedJobBelongsToCustomer ? current.job_id : '',
      };
    });
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    setIsSubmitting(true);
    setMessage(null);
    setErrorMessage(null);

    try {
      const response = await fetch('/api/change-orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: formData.customer_id,
          job_id: formData.job_id,
          change_order_number: formData.change_order_number,
          title: formData.title,
          description: formData.description,
          labor_cost: parseNumber(formData.labor_cost),
          material_cost: parseNumber(formData.material_cost),
          other_cost: parseNumber(formData.other_cost),
          markup_percent: parseNumber(formData.markup_percent),
          tax_percent: parseNumber(formData.tax_percent),
          status: formData.status,
        }),
      });

      const result = (await response.json()) as CreateChangeOrderResponse;

      if (!response.ok) {
        setErrorMessage(
          result.message ?? 'Something went wrong creating the change order.'
        );
        return;
      }

      setFormData(initialFormState);
      setMessage('Change order created successfully.');
    } catch {
      setErrorMessage('Something went wrong creating the change order.');
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading customers and jobs...
      </div>
    );
  }

  if (loadingError) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-6 text-sm text-rose-700 shadow-sm">
        {loadingError}
      </div>
    );
  }

  if (customers.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
        Add a customer before creating a change order.
      </div>
    );
  }

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-6 text-sm text-amber-800 shadow-sm">
        Add a job before creating a change order.
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="space-y-6 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <div className="grid gap-5 lg:grid-cols-2">
        <label className="block text-sm font-medium text-slate-700">
          Customer
          <select
            name="customer_id"
            value={formData.customer_id}
            onChange={handleCustomerChange}
            required
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select a customer</option>
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.name}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Job
          <select
            name="job_id"
            value={formData.job_id}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="">Select a job</option>
            {filteredJobs.map((job) => (
              <option key={job.id} value={job.id}>
                {job.name}
                {job.job_number ? ` (${job.job_number})` : ''}
              </option>
            ))}
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Change Order Number
          <input
            type="text"
            name="change_order_number"
            value={formData.change_order_number}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Status
          <select
            name="status"
            value={formData.status}
            onChange={handleChange}
            className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          >
            <option value="draft">draft</option>
            <option value="sent">sent</option>
            <option value="approved">approved</option>
            <option value="rejected">rejected</option>
            <option value="invoiced">invoiced</option>
          </select>
        </label>

        <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
          Title
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            required
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700 lg:col-span-2">
          Description
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            rows={4}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Labor Cost
          <input
            type="number"
            name="labor_cost"
            value={formData.labor_cost}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Material Cost
          <input
            type="number"
            name="material_cost"
            value={formData.material_cost}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Other Cost
          <input
            type="number"
            name="other_cost"
            value={formData.other_cost}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Markup Percent
          <input
            type="number"
            name="markup_percent"
            value={formData.markup_percent}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>

        <label className="block text-sm font-medium text-slate-700">
          Tax Percent
          <input
            type="number"
            name="tax_percent"
            value={formData.tax_percent}
            onChange={handleChange}
            step="0.01"
            min="0"
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
          />
        </label>
      </div>

      <div className="rounded-lg border border-slate-200 bg-slate-50 p-4">
        <h3 className="text-sm font-semibold text-slate-900">Live Estimate</h3>
        <dl className="mt-3 grid gap-2 text-sm text-slate-700 sm:grid-cols-2">
          <div className="flex items-center justify-between rounded-md bg-white px-3 py-2">
            <dt>Subtotal</dt>
            <dd className="font-medium">{formatCurrency(totals.subtotal)}</dd>
          </div>
          <div className="flex items-center justify-between rounded-md bg-white px-3 py-2">
            <dt>Markup</dt>
            <dd className="font-medium">{formatCurrency(totals.markupAmount)}</dd>
          </div>
          <div className="flex items-center justify-between rounded-md bg-white px-3 py-2">
            <dt>Tax</dt>
            <dd className="font-medium">{formatCurrency(totals.taxAmount)}</dd>
          </div>
          <div className="flex items-center justify-between rounded-md bg-white px-3 py-2">
            <dt>Total</dt>
            <dd className="font-semibold text-slate-900">
              {formatCurrency(totals.totalAmount)}
            </dd>
          </div>
        </dl>
      </div>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <button
          type="submit"
          disabled={isSubmitting}
          className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating change order...' : 'Create Change Order'}
        </button>

        {message ? <p className="text-sm text-emerald-600">{message}</p> : null}
        {errorMessage ? <p className="text-sm text-rose-600">{errorMessage}</p> : null}
      </div>
    </form>
  );
}
