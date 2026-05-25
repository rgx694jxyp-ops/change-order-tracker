"use client";

import { useEffect, useState } from 'react';

import { ChangeOrderAttachments } from '@/components/change-order-attachments';

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

type ApprovalLinkResponse = {
  ok?: boolean;
  message?: string;
  approval_url?: string;
};

type SendApprovalEmailResponse = {
  ok?: boolean;
  message?: string;
  approval_url?: string;
};

type EmailFeedback = {
  type: 'success' | 'error';
  message: string;
  approvalUrl?: string;
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
  const [generatingLinkId, setGeneratingLinkId] = useState<string | null>(null);
  const [approvalLinks, setApprovalLinks] = useState<Record<string, string>>({});
  const [actionError, setActionError] = useState<{ id: string; message: string } | null>(
    null
  );
  const [copiedMessageId, setCopiedMessageId] = useState<string | null>(null);
  const [emailInputs, setEmailInputs] = useState<Record<string, string>>({});
  const [sendingEmailId, setSendingEmailId] = useState<string | null>(null);
  const [emailFeedbackById, setEmailFeedbackById] = useState<Record<string, EmailFeedback>>(
    {}
  );

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

  async function handleGenerateApprovalLink(changeOrderId: string) {
    setGeneratingLinkId(changeOrderId);
    setActionError(null);
    setCopiedMessageId(null);

    try {
      const response = await fetch(`/api/change-orders/${changeOrderId}/approval-link`, {
        method: 'POST',
      });
      const result = (await response.json()) as ApprovalLinkResponse;

      if (!response.ok) {
        setActionError({
          id: changeOrderId,
          message: result.message ?? 'Something went wrong generating the approval link.',
        });
        return;
      }

      if (!result.approval_url) {
        setActionError({
          id: changeOrderId,
          message: 'Something went wrong generating the approval link.',
        });
        return;
      }

      const fullUrl = `${window.location.origin}${result.approval_url}`;
      setApprovalLinks((current) => ({
        ...current,
        [changeOrderId]: fullUrl,
      }));
    } catch {
      setActionError({
        id: changeOrderId,
        message: 'Something went wrong generating the approval link.',
      });
    } finally {
      setGeneratingLinkId(null);
    }
  }

  async function handleCopyLink(changeOrderId: string) {
    const link = approvalLinks[changeOrderId];

    if (!link) {
      return;
    }

    try {
      await navigator.clipboard.writeText(link);
      setCopiedMessageId(changeOrderId);
      setActionError(null);
    } catch {
      setActionError({
        id: changeOrderId,
        message: 'Failed to copy approval link.',
      });
    }
  }

  function handleEmailInputChange(changeOrderId: string, value: string) {
    setEmailInputs((current) => ({
      ...current,
      [changeOrderId]: value,
    }));

    setEmailFeedbackById((current) => {
      if (!current[changeOrderId]) {
        return current;
      }

      const next = { ...current };
      delete next[changeOrderId];
      return next;
    });
  }

  async function handleSendApprovalEmail(changeOrderId: string) {
    const emailValue = (emailInputs[changeOrderId] ?? '').trim();

    if (!emailValue) {
      setEmailFeedbackById((current) => ({
        ...current,
        [changeOrderId]: {
          type: 'error',
          message: 'Enter an email address.',
        },
      }));
      return;
    }

    setSendingEmailId(changeOrderId);

    try {
      const response = await fetch(`/api/change-orders/${changeOrderId}/send-approval-email`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          recipient_email: emailValue,
          base_url: window.location.origin,
        }),
      });

      const result = (await response.json()) as SendApprovalEmailResponse;

      if (!response.ok) {
        setEmailFeedbackById((current) => ({
          ...current,
          [changeOrderId]: {
            type: 'error',
            message: result.message ?? 'Something went wrong sending the approval email.',
          },
        }));
        return;
      }

      const approvalUrl =
        result.approval_url && result.approval_url.startsWith('/')
          ? `${window.location.origin}${result.approval_url}`
          : result.approval_url;

      setEmailFeedbackById((current) => ({
        ...current,
        [changeOrderId]: {
          type: 'success',
          message: 'Approval email sent.',
          approvalUrl,
        },
      }));
    } catch {
      setEmailFeedbackById((current) => ({
        ...current,
        [changeOrderId]: {
          type: 'error',
          message: 'Something went wrong sending the approval email.',
        },
      }));
    } finally {
      setSendingEmailId(null);
    }
  }

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

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <a
              href={`/api/change-orders/${changeOrder.id}/pdf`}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              View PDF
            </a>

            <button
              type="button"
              onClick={() => void handleGenerateApprovalLink(changeOrder.id)}
              disabled={generatingLinkId === changeOrder.id}
              className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {generatingLinkId === changeOrder.id
                ? 'Generating...'
                : 'Generate Approval Link'}
            </button>
          </div>

          {approvalLinks[changeOrder.id] ? (
            <div className="mt-3 rounded-md border border-slate-200 bg-slate-50 p-3">
              <p className="break-all text-xs text-slate-700">{approvalLinks[changeOrder.id]}</p>
              <div className="mt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => void handleCopyLink(changeOrder.id)}
                  className="inline-flex items-center rounded-md border border-slate-300 bg-white px-3 py-1.5 text-xs font-medium text-slate-700 transition hover:bg-slate-50"
                >
                  Copy Link
                </button>
                {copiedMessageId === changeOrder.id ? (
                  <p className="text-xs text-emerald-700">Approval link copied.</p>
                ) : null}
              </div>
            </div>
          ) : null}

          {actionError?.id === changeOrder.id ? (
            <p className="mt-3 text-sm text-rose-700">{actionError.message}</p>
          ) : null}

          <div className="mt-4 rounded-md border border-slate-200 bg-slate-50 p-3">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                type="email"
                placeholder="customer@example.com"
                value={emailInputs[changeOrder.id] ?? ''}
                onChange={(event) =>
                  handleEmailInputChange(changeOrder.id, event.target.value)
                }
                className="w-full rounded-md border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-slate-400 focus:ring-2 focus:ring-slate-200"
              />
              <button
                type="button"
                onClick={() => void handleSendApprovalEmail(changeOrder.id)}
                disabled={sendingEmailId === changeOrder.id}
                className="inline-flex items-center justify-center rounded-md border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {sendingEmailId === changeOrder.id
                  ? 'Sending...'
                  : 'Send Approval Email'}
              </button>
            </div>

            {emailFeedbackById[changeOrder.id] ? (
              <div className="mt-2">
                <p
                  className={`text-sm ${
                    emailFeedbackById[changeOrder.id].type === 'error'
                      ? 'text-rose-700'
                      : 'text-emerald-700'
                  }`}
                >
                  {emailFeedbackById[changeOrder.id].message}
                </p>
                {emailFeedbackById[changeOrder.id].approvalUrl ? (
                  <p className="mt-1 break-all text-xs text-slate-700">
                    {emailFeedbackById[changeOrder.id].approvalUrl}
                  </p>
                ) : null}
              </div>
            ) : null}
          </div>

          <div className="mt-4">
            <ChangeOrderAttachments changeOrderId={changeOrder.id} />
          </div>
        </article>
      ))}
    </div>
  );
}
