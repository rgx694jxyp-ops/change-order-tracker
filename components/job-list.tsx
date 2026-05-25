"use client";

import { useEffect, useState } from 'react';

type Customer = {
  id: string;
  name: string;
};

type Job = {
  id: string;
  customer_id: string;
  name: string;
  job_number: string | null;
  address: string | null;
  description: string | null;
  status: string;
  created_at: string;
  customers?: { name: string } | null;
};

type JobsResponse = {
  ok?: boolean;
  message?: string;
  jobs?: Job[];
};

type CustomersResponse = {
  ok?: boolean;
  message?: string;
  customers?: Customer[];
};

type JobResponse = {
  ok?: boolean;
  message?: string;
  job?: Job;
};

type EditFormState = {
  customer_id: string;
  name: string;
  job_number: string;
  address: string;
  description: string;
  status: 'active' | 'completed' | 'archived';
};

const initialEditFormState: EditFormState = {
  customer_id: '',
  name: '',
  job_number: '',
  address: '',
  description: '',
  status: 'active',
};

function toEditableStatus(status: string): EditFormState['status'] {
  if (status === 'completed' || status === 'archived') {
    return status;
  }

  return 'active';
}

function toEditFormState(job: Job): EditFormState {
  return {
    customer_id: job.customer_id,
    name: job.name,
    job_number: job.job_number ?? '',
    address: job.address ?? '',
    description: job.description ?? '',
    status: toEditableStatus(job.status),
  };
}

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [editingJobId, setEditingJobId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<EditFormState>(initialEditFormState);
  const [isSavingJobId, setIsSavingJobId] = useState<string | null>(null);
  const [isDeletingJobId, setIsDeletingJobId] = useState<string | null>(null);
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(
    null
  );

  useEffect(() => {
    let isMounted = true;

    async function loadData() {
      try {
        const [jobsResponse, customersResponse] = await Promise.all([
          fetch('/api/jobs'),
          fetch('/api/customers'),
        ]);

        const jobsResult = (await jobsResponse.json()) as JobsResponse;
        const customersResult = (await customersResponse.json()) as CustomersResponse;

        if (!jobsResponse.ok) {
          if (isMounted) {
            setErrorMessage(jobsResult.message ?? 'Something went wrong loading jobs.');
          }
          return;
        }

        if (!customersResponse.ok) {
          if (isMounted) {
            setErrorMessage(
              customersResult.message ?? 'Something went wrong loading customers.'
            );
          }
          return;
        }

        if (isMounted) {
          setJobs(jobsResult.jobs ?? []);
          setCustomers(customersResult.customers ?? []);
        }
      } catch {
        if (isMounted) {
          setErrorMessage('Something went wrong loading jobs.');
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

  function handleEditClick(job: Job) {
    setEditingJobId(job.id);
    setEditForm(toEditFormState(job));
    setActionError(null);
  }

  function handleCancelEdit() {
    setEditingJobId(null);
    setEditForm(initialEditFormState);
    setActionError(null);
  }

  function handleEditChange(
    event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) {
    const { name, value } = event.target;
    setEditForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSave(jobId: string) {
    const trimmedCustomerId = editForm.customer_id.trim();
    const trimmedName = editForm.name.trim();

    if (!trimmedCustomerId) {
      setActionError({ id: jobId, message: 'Customer is required' });
      return;
    }

    if (!trimmedName) {
      setActionError({ id: jobId, message: 'Job name is required' });
      return;
    }

    setIsSavingJobId(jobId);
    setActionError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customer_id: editForm.customer_id,
          name: editForm.name,
          job_number: editForm.job_number,
          address: editForm.address,
          description: editForm.description,
          status: editForm.status,
        }),
      });

      const result = (await response.json()) as JobResponse;

      if (!response.ok) {
        setActionError({
          id: jobId,
          message: result.message ?? 'Something went wrong updating the job.',
        });
        return;
      }

      if (result.job) {
        setJobs((current) =>
          current.map((job) => (job.id === jobId ? result.job! : job))
        );
      }

      setEditingJobId(null);
      setEditForm(initialEditFormState);
      setActionError(null);
    } catch {
      setActionError({ id: jobId, message: 'Something went wrong updating the job.' });
    } finally {
      setIsSavingJobId(null);
    }
  }

  async function handleDelete(jobId: string) {
    const confirmed = window.confirm(
      'Delete this job? Existing change orders tied to this job may also be affected later.'
    );

    if (!confirmed) {
      return;
    }

    setIsDeletingJobId(jobId);
    setActionError(null);

    try {
      const response = await fetch(`/api/jobs/${jobId}`, {
        method: 'DELETE',
      });

      const result = (await response.json()) as { ok?: boolean; message?: string };

      if (!response.ok) {
        setActionError({
          id: jobId,
          message: result.message ?? 'Something went wrong deleting the job.',
        });
        return;
      }

      setJobs((current) => current.filter((job) => job.id !== jobId));

      if (editingJobId === jobId) {
        setEditingJobId(null);
        setEditForm(initialEditFormState);
      }
    } catch {
      setActionError({ id: jobId, message: 'Something went wrong deleting the job.' });
    } finally {
      setIsDeletingJobId(null);
    }
  }

  if (isLoading) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
        Loading jobs...
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

  if (jobs.length === 0) {
    return (
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-900">No jobs yet</h2>
        <p className="mt-2 text-sm text-slate-600 sm:text-base">
          Jobs will appear here once you start adding customer projects.
        </p>
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2">
      {jobs.map((job) => {
        const isEditing = editingJobId === job.id;
        const isSaving = isSavingJobId === job.id;
        const isDeleting = isDeletingJobId === job.id;

        return (
          <article
            key={job.id}
            className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
          >
            {isEditing ? (
              <form
                className="space-y-4"
                onSubmit={(event) => {
                  event.preventDefault();
                  void handleSave(job.id);
                }}
              >
                <label className="block text-sm font-medium text-slate-700">
                  Customer
                  <select
                    name="customer_id"
                    value={editForm.customer_id}
                    onChange={handleEditChange}
                    required
                    disabled={isSaving || isDeleting}
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
                  Job Number
                  <input
                    type="text"
                    name="job_number"
                    value={editForm.job_number}
                    onChange={handleEditChange}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Address
                  <input
                    type="text"
                    name="address"
                    value={editForm.address}
                    onChange={handleEditChange}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Description
                  <textarea
                    name="description"
                    value={editForm.description}
                    onChange={handleEditChange}
                    rows={4}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  />
                </label>

                <label className="block text-sm font-medium text-slate-700">
                  Status
                  <select
                    name="status"
                    value={editForm.status}
                    onChange={handleEditChange}
                    disabled={isSaving || isDeleting}
                    className="mt-1 w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
                  >
                    <option value="active">active</option>
                    <option value="completed">completed</option>
                    <option value="archived">archived</option>
                  </select>
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
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">{job.name}</h2>
                    {job.customers?.name ? (
                      <p className="mt-1 text-sm text-slate-500">{job.customers.name}</p>
                    ) : null}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
                      {job.status}
                    </span>
                    <button
                      type="button"
                      onClick={() => handleEditClick(job)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDelete(job.id)}
                      disabled={isDeleting}
                      className="inline-flex items-center rounded-md border border-rose-300 bg-white px-3 py-1.5 text-sm font-medium text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isDeleting ? 'Deleting...' : 'Delete'}
                    </button>
                  </div>
                </div>

                <dl className="mt-4 space-y-3 text-sm text-slate-600">
                  {job.job_number ? (
                    <div>
                      <dt className="font-medium text-slate-700">Job Number</dt>
                      <dd>{job.job_number}</dd>
                    </div>
                  ) : null}

                  {job.address ? (
                    <div>
                      <dt className="font-medium text-slate-700">Address</dt>
                      <dd className="whitespace-pre-line">{job.address}</dd>
                    </div>
                  ) : null}

                  {job.description ? (
                    <div>
                      <dt className="font-medium text-slate-700">Description</dt>
                      <dd className="whitespace-pre-line">{job.description}</dd>
                    </div>
                  ) : null}
                </dl>
              </>
            )}

            {actionError?.id === job.id ? (
              <p className="mt-4 text-sm text-rose-600">{actionError.message}</p>
            ) : null}
          </article>
        );
      })}
    </div>
  );
}
