import { NextResponse } from 'next/server';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

const VALID_JOB_STATUSES = ['active', 'completed', 'archived'] as const;

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export async function GET() {
  const result = await getCurrentCompanyContext();

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        ...(result.error ? { error: result.error } : {}),
      },
      { status: result.status }
    );
  }

  const { companyId } = result.context;

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select(
      'id, company_id, customer_id, name, job_number, address, description, status, created_at, customers(name)'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load jobs',
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, jobs: data });
}

export async function POST(request: Request) {
  const result = await getCurrentCompanyContext();

  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        message: result.message,
        ...(result.error ? { error: result.error } : {}),
      },
      { status: result.status }
    );
  }

  const { companyId } = result.context;

  const body = await request.json();
  const trimmedCustomerId = typeof body.customer_id === 'string' ? body.customer_id.trim() : '';
  const trimmedName = typeof body.name === 'string' ? body.name.trim() : '';
  const normalizedStatus =
    typeof body.status === 'string' && body.status.trim().length > 0
      ? body.status.trim()
      : 'active';

  if (!trimmedCustomerId) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Customer is required',
      },
      { status: 400 }
    );
  }

  if (!trimmedName) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Job name is required',
      },
      { status: 400 }
    );
  }

  if (!VALID_JOB_STATUSES.includes(normalizedStatus as (typeof VALID_JOB_STATUSES)[number])) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Invalid job status',
      },
      { status: 400 }
    );
  }

  const { data: customer, error: customerError } = await supabaseAdmin
    .from('customers')
    .select('id')
    .eq('id', trimmedCustomerId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (customerError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create job',
        error: customerError.message,
      },
      { status: 500 }
    );
  }

  if (!customer) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Customer not found',
      },
      { status: 404 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .insert({
      company_id: companyId,
      customer_id: trimmedCustomerId,
      name: trimmedName,
      job_number: normalizeOptionalString(body.job_number),
      address: normalizeOptionalString(body.address),
      description: normalizeOptionalString(body.description),
      status: normalizedStatus,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create job',
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, job: data });
}
