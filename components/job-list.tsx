"use client";

import { useEffect, useState } from 'react';

type Job = {
  id: string;
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

export function JobList() {
  const [jobs, setJobs] = useState<Job[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadJobs() {
      try {
        const response = await fetch('/api/jobs');
        const result = (await response.json()) as JobsResponse;

        if (!response.ok) {
          if (isMounted) {
            setErrorMessage(result.message ?? 'Something went wrong loading jobs.');
          }
          return;
        }

        if (isMounted) {
          setJobs(result.jobs ?? []);
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

    loadJobs();

    return () => {
      isMounted = false;
    };
  }, []);

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
      {jobs.map((job) => (
        <article
          key={job.id}
          className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-semibold text-slate-900">{job.name}</h2>
              {job.customers?.name ? (
                <p className="mt-1 text-sm text-slate-500">{job.customers.name}</p>
              ) : null}
            </div>
            <span className="rounded-full border border-slate-200 bg-slate-50 px-2.5 py-1 text-xs font-medium capitalize text-slate-600">
              {job.status}
            </span>
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
        </article>
      ))}
    </div>
  );
}
