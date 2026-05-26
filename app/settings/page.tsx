"use client";

import { FormEvent, useEffect, useState } from 'react';

import { AppShell } from '@/components/app-shell';
import CompanyRequiredGuard from '@/components/company-required-guard';

type CompanySettings = {
  name: string;
  phone: string | null;
  email: string | null;
  billing_email: string | null;
  address: string | null;
  default_markup_percent: number;
  default_tax_percent: number;
  timezone: string;
};

type CompanySettingsResponse = {
  ok?: boolean;
  message?: string;
  company?: CompanySettings;
};

type SettingsFormValues = {
  name: string;
  phone: string;
  email: string;
  billing_email: string;
  address: string;
  default_markup_percent: string;
  default_tax_percent: string;
  timezone: string;
};

function toFormValues(company: CompanySettings): SettingsFormValues {
  return {
    name: company.name ?? '',
    phone: company.phone ?? '',
    email: company.email ?? '',
    billing_email: company.billing_email ?? '',
    address: company.address ?? '',
    default_markup_percent: String(company.default_markup_percent ?? 0),
    default_tax_percent: String(company.default_tax_percent ?? 0),
    timezone: company.timezone ?? '',
  };
}

function emptyFormValues(): SettingsFormValues {
  return {
    name: '',
    phone: '',
    email: '',
    billing_email: '',
    address: '',
    default_markup_percent: '0',
    default_tax_percent: '0',
    timezone: '',
  };
}

export default function SettingsPage() {
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const [formValues, setFormValues] = useState<SettingsFormValues>(emptyFormValues());

  useEffect(() => {
    let isMounted = true;

    async function loadSettings() {
      setLoadError(null);

      try {
        const response = await fetch('/api/company/settings');
        const result = (await response.json()) as CompanySettingsResponse;

        if (!response.ok || !result.ok || !result.company) {
          if (isMounted) {
            setLoadError(result.message ?? 'Failed to load company settings.');
          }
          return;
        }

        if (isMounted) {
          setFormValues(toFormValues(result.company));
        }
      } catch {
        if (isMounted) {
          setLoadError('Failed to load company settings.');
        }
      } finally {
        if (isMounted) {
          setIsLoading(false);
        }
      }
    }

    void loadSettings();

    return () => {
      isMounted = false;
    };
  }, []);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaveError(null);
    setSaveMessage(null);
    setIsSaving(true);

    const payload = {
      name: formValues.name,
      phone: formValues.phone,
      email: formValues.email,
      billing_email: formValues.billing_email,
      address: formValues.address,
      default_markup_percent: Number(formValues.default_markup_percent),
      default_tax_percent: Number(formValues.default_tax_percent),
      timezone: formValues.timezone,
    };

    try {
      const response = await fetch('/api/company/settings', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
      });

      const result = (await response.json()) as CompanySettingsResponse;

      if (!response.ok || !result.ok || !result.company) {
        setSaveError(result.message ?? 'Failed to save company settings.');
        return;
      }

      setFormValues(toFormValues(result.company));
      setSaveMessage('Settings saved.');
    } catch {
      setSaveError('Failed to save company settings.');
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <CompanyRequiredGuard>
      <AppShell>
        <div className="mx-auto w-full max-w-5xl space-y-6">
          <header>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-900">
              Settings
            </h1>
            <p className="mt-2 max-w-3xl text-sm text-slate-600 sm:text-base">
              Manage company defaults used for change orders, job costing, and
              approvals.
            </p>
          </header>

          <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
            <h2 className="text-lg font-semibold text-slate-900">Company setup</h2>

            {isLoading ? (
              <p className="mt-4 text-sm text-slate-600">Loading company settings...</p>
            ) : null}

            {!isLoading && loadError ? (
              <p className="mt-4 text-sm text-rose-700">{loadError}</p>
            ) : null}

            {!isLoading && !loadError ? (
              <form className="mt-4 space-y-4" onSubmit={(event) => void handleSubmit(event)}>
                <div>
                  <label
                    htmlFor="company-name"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Company name
                  </label>
                  <input
                    id="company-name"
                    type="text"
                    required
                    value={formValues.name}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        name: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label
                      htmlFor="company-phone"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Phone
                    </label>
                    <input
                      id="company-phone"
                      type="text"
                      value={formValues.phone}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          phone: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company-email"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Email
                    </label>
                    <input
                      id="company-email"
                      type="email"
                      value={formValues.email}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          email: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company-billing-email"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Billing email
                    </label>
                    <input
                      id="company-billing-email"
                      type="email"
                      value={formValues.billing_email}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          billing_email: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company-timezone"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Timezone
                    </label>
                    <input
                      id="company-timezone"
                      type="text"
                      value={formValues.timezone}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          timezone: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company-default-markup"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Default markup %
                    </label>
                    <input
                      id="company-default-markup"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={formValues.default_markup_percent}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          default_markup_percent: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="company-default-tax"
                      className="mb-1 block text-sm font-medium text-slate-700"
                    >
                      Default tax %
                    </label>
                    <input
                      id="company-default-tax"
                      type="number"
                      min={0}
                      max={100}
                      step="0.01"
                      value={formValues.default_tax_percent}
                      onChange={(event) =>
                        setFormValues((current) => ({
                          ...current,
                          default_tax_percent: event.target.value,
                        }))
                      }
                      className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="company-address"
                    className="mb-1 block text-sm font-medium text-slate-700"
                  >
                    Address
                  </label>
                  <textarea
                    id="company-address"
                    rows={3}
                    value={formValues.address}
                    onChange={(event) =>
                      setFormValues((current) => ({
                        ...current,
                        address: event.target.value,
                      }))
                    }
                    className="w-full rounded-md border border-slate-300 px-3 py-2 text-sm text-slate-900 focus:border-slate-400 focus:outline-none focus:ring-2 focus:ring-slate-200"
                  />
                </div>

                {saveError ? <p className="text-sm text-rose-700">{saveError}</p> : null}
                {saveMessage ? <p className="text-sm text-emerald-700">{saveMessage}</p> : null}

                <div>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center justify-center rounded-md bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {isSaving ? 'Saving...' : 'Save settings'}
                  </button>
                </div>
              </form>
            ) : null}
          </section>
        </div>
      </AppShell>
    </CompanyRequiredGuard>
  );
}
