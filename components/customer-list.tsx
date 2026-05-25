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

type CustomerResponse = {
  ok?: boolean;
  message?: string;
  customer?: Customer;
};

type EditFormState = {
  name: string;
  contact_name: string;
  email: string;
  phone: string;
  billing_address: string;
  notes: string;
};

const initialEditFormState: EditFormState = {
  name: '',
  contact_name: '',
  email: '',
  phone: '',
  billing_address: '',
  notes: '',
};

function toEditFormState(customer: Customer): EditFormState {
  return {
    name: customer.name,
    contact_name: customer.contact_name ?? '',
    email: customer.email ?? '',
    phone: customer.phone ?? '',
    billing_address: customer.billing_address ?? '',
    notes: customer.notes ?? '',
  };
}

export function CustomerList() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingCustomerId, setEditingCustomerId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditFormState);
  const [isSavingCustomerId, setIsSavingCustomerId] = useState<string | null>(null);
  const [isDeletingCustomerId, setIsDeletingCustomerId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(
    null
  );

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

  function handleEditClick(customer: Customer) {
    setEditingCustomerId(customer.id);
    setEditForm(toEditFormState(customer));
    setActionError(null);
  }

  function handleCancelEdit() {
    setEditingCustomerId(null);
    setEditForm(initialEditFormState);
    setActionError(null);
  }

  function handleEditChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) {
    const { name, value } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(customerId: string) {
    const trimmedName = editForm.name.trim();

    if (!trimmedName) {
      setActionError({ id: customerId, message: 'Customer name is required' });
      return;
    }

    setIsSavingCustomerId(customerId);
    setActionError(null);

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: editForm.name,
          contact_name: editForm.contact_name,
          email: editForm.email,
          phone: editForm.phone,
          billing_address: editForm.billing_address,
          notes: editForm.notes,
        }),
      });

      const result = (await response.json()) as CustomerResponse;

      if (!response.ok) {
        setActionError({
          id: customerId,
          message: result.message ?? 'Something went wrong updating the customer.',
        });
        return;
      }

      if (result.customer) {
        setCustomers((current) =>
          current.map((customer) =>
            customer.id === customerId ? result.customer! : customer
          )
        );
      }

      setEditingCustomerId(null);
      setEditForm(initialEditFormState);
      setActionError(null);
    } catch {
      setActionError({
        id: customerId,
        message: 'Something went wrong updating the customer.',
      });
    } finally {
      setIsSavingCustomerId(null);
    }
  }

  async function handleDelete(customerId: string) {
    const confirmed = window.confirm(
      'Delete this customer? This may also remove jobs tied to this customer.'
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingCustomerId(customerId);
    setActionError(null);

    try {
      const response = await fetch(`/api/customers/${customerId}`, {
        method: 'DELETE',
      });

      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        setActionError({
          id: customerId,
          message: result.message ?? 'Something went wrong deleting the customer.',
        });
        return;
      }

      setCustomers((current) => current.filter((customer) => customer.id !== customerId));

      if (editingCustomerId === customerId) {
        setEditingCustomerId(null);
        setEditForm(initialEditFormState);
      }
    } catch {
      setActionError({
        id: customerId,
        message: 'Something went wrong deleting the customer.',
      });
    } finally {
      setIsDeletingCustomerId(null);
    }
  }

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
      {customers.map((customer) => {
        const isEditing = editingCustomerId === customer.id;
        const isSaving = isSavingCustomerId === customer.id;
        const isDeleting = isDeletingCustomerId === customer.id;

        return (
          <article
            key={customer.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            {isEditing ? (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSave(customer.id);
                }}
              >
                <label className="block text-sm font-medium text-slate-700">
                  Name
                  <input
                    type="text"
                    name="name"
                    value={editForm.name}
                    onChange={handleEditChange}
                    required
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Contact Name
                  <input
                    type="text"
                    name="contact_name"
                    value={editForm.contact_name}
                    onChange={handleEditChange}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Email
                  <input
                    type="email"
                    name="email"
                    value={editForm.email}
                    onChange={handleEditChange}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Phone
                  <input
                    type="text"
                    name="phone"
                    value={editForm.phone}
                    onChange={handleEditChange}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Billing Address
                  <input
                    type="text"
                    name="billing_address"
                    value={editForm.billing_address}
                    onChange={handleEditChange}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Notes
                  <textarea
                    name="notes"
                    value={editForm.notes}
                    onChange={handleEditChange}
                    rows={4}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="submit"
                    disabled={isSaving || isDeleting}
                    className="inline-flex items-center rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save'}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving || isDeleting}
                    className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <>
                <div className="flex items-start justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">{customer.name}</h2>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => handleEditClick(customer)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(customer.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

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
              </>
            )}

            {actionError?.id === customer.id ? (
              <p className="mt-4 text-sm text-rose-600">{actionError.message}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
