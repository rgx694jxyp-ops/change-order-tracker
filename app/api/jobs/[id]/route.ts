import { NextResponse } from 'next/server';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

const VALID_JOB_STATUSES = ['active', 'completed', 'archived'] as const;

type RouteContext = {
  params: Promise<{ id: string }>;
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

export async function GET(_request: Request, context: RouteContext) {
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
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .select(
      'id, company_id, customer_id, name, job_number, address, description, status, created_at, customers(name)'
    )
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load job',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Job not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, job: data });
}

export async function PATCH(request: Request, context: RouteContext) {
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
  const { id } = await context.params;
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
        message: 'Failed to update job',
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
    .update({
      customer_id: trimmedCustomerId,
      name: trimmedName,
      job_number: normalizeOptionalString(body.job_number),
      address: normalizeOptionalString(body.address),
      description: normalizeOptionalString(body.description),
      status: normalizedStatus,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select(
      'id, company_id, customer_id, name, job_number, address, description, status, created_at, customers(name)'
    )
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to update job',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Job not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, job: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
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
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from('jobs')
    .delete()
    .eq('id', id)
    .eq('company_id', companyId)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to delete job',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Job not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, message: 'Job deleted' });
}
