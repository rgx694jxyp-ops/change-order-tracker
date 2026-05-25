import { NextResponse } from 'next/server';

import { resend } from '@/lib/email/resend';
import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ChangeOrderRecord = {
  id: string;
  change_order_number: string | null;
  title: string;
  total_amount: number | string | null;
  status: string;
  approval_token: string | null;
  customers:
    | {
        name: string | null;
        contact_name: string | null;
        email: string | null;
      }
    | {
        name: string | null;
        contact_name: string | null;
        email: string | null;
      }[]
    | null;
  jobs:
    | {
        name: string | null;
        job_number: string | null;
      }
    | {
        name: string | null;
        job_number: string | null;
      }[]
    | null;
};

function firstRecord<T>(value: T | T[] | null | undefined): T | null {
  if (!value) {
    return null;
  }

  return Array.isArray(value) ? (value[0] ?? null) : value;
}

function formatUsd(value: number | string | null | undefined) {
  const parsed = Number(value ?? 0);
  const amount = Number.isFinite(parsed) ? parsed : 0;

  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(amount);
}

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, '');
}

export async function POST(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = (await request.json()) as {
    recipient_email?: string;
    base_url?: string;
  };

  const recipientEmail =
    typeof body.recipient_email === 'string' ? body.recipient_email.trim() : '';

  if (!recipientEmail) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Recipient email is required',
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('change_orders')
    .select(
      'id, change_order_number, title, total_amount, status, approval_token, customers(name, contact_name, email), jobs(name, job_number)'
    )
    .eq('id', id)
    .eq('company_id', DEMO_COMPANY_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load change order',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Change order not found',
      },
      { status: 404 }
    );
  }

  const changeOrder = data as ChangeOrderRecord;
  const customer = firstRecord(changeOrder.customers);
  const job = firstRecord(changeOrder.jobs);

  const approvalToken = changeOrder.approval_token ?? crypto.randomUUID();
  const now = new Date().toISOString();

  const { error: updateError } = await supabaseAdmin
    .from('change_orders')
    .update({
      approval_token: approvalToken,
      status: 'sent',
      sent_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .eq('company_id', DEMO_COMPANY_ID);

  if (updateError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to prepare approval link',
        error: updateError.message,
      },
      { status: 500 }
    );
  }

  const baseUrlInput =
    typeof body.base_url === 'string' && body.base_url.trim().length > 0
      ? body.base_url.trim()
      : 'http://localhost:3000';
  const baseUrl = trimTrailingSlash(baseUrlInput);
  const approvalUrl = `${baseUrl}/approve/${approvalToken}`;

  const changeOrderLabel = changeOrder.change_order_number || changeOrder.title;
  const jobName = job?.name ? `Job: ${job.name}` : '';
  const customerName = customer?.name ? `Customer: ${customer.name}` : '';
  const totalAmount = formatUsd(changeOrder.total_amount);

  const subject = `Change Order Approval Needed: ${changeOrderLabel}`;

  const html = `
    <div>
      <p><strong>Demo Contractor</strong></p>
      <p>Change order: ${changeOrderLabel}</p>
      ${jobName ? `<p>${jobName}</p>` : ''}
      ${customerName ? `<p>${customerName}</p>` : ''}
      <p>Total amount: ${totalAmount}</p>
      <p><a href="${approvalUrl}">Review and respond to this change order</a></p>
      <p>You can approve or reject this change order using the link above.</p>
    </div>
  `;

  const textLines = [
    'Demo Contractor',
    `Change order: ${changeOrderLabel}`,
    jobName,
    customerName,
    `Total amount: ${totalAmount}`,
    `Approval link: ${approvalUrl}`,
    'You can approve or reject this change order using the link above.',
  ].filter((line) => line && line.trim().length > 0);

  const { error: resendError } = await resend.emails.send({
    from: 'Change Order Tracker <onboarding@resend.dev>',
    to: recipientEmail,
    subject,
    html,
    text: textLines.join('\n'),
  });

  if (resendError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to send approval email',
        error: resendError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Approval email sent',
    approval_url: approvalUrl,
    email: {
      to: recipientEmail,
    },
  });
}
