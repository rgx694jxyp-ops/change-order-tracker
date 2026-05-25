import { NextResponse } from 'next/server';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

const VALID_CHANGE_ORDER_STATUSES = [
  'draft',
  'sent',
  'approved',
  'rejected',
  'invoiced',
] as const;

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmedValue = value.trim();
  return trimmedValue.length > 0 ? trimmedValue : null;
}

function parseNonNegativeNumber(value: unknown) {
  if (value === null || value === undefined) {
    return { value: 0, isNegative: false };
  }

  if (typeof value === 'string') {
    const trimmedValue = value.trim();

    if (trimmedValue.length === 0) {
      return { value: 0, isNegative: false };
    }

    const parsedValue = Number(trimmedValue);
    if (Number.isNaN(parsedValue)) {
      return { value: 0, isNegative: false };
    }

    return { value: parsedValue, isNegative: parsedValue < 0 };
  }

  const parsedValue = Number(value);
  if (Number.isNaN(parsedValue)) {
    return { value: 0, isNegative: false };
  }

  return { value: parsedValue, isNegative: parsedValue < 0 };
}

function roundToTwo(value: number) {
  return Math.round(value * 100) / 100;
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
    .from('change_orders')
    .select(
      'id, company_id, customer_id, job_id, change_order_number, title, description, labor_cost, material_cost, other_cost, markup_percent, tax_percent, subtotal, markup_amount, tax_amount, total_amount, status, created_at, customers(name), jobs(name)'
    )
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load change orders',
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, change_orders: data });
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

  const trimmedCustomerId =
    typeof body.customer_id === 'string' ? body.customer_id.trim() : '';
  const trimmedJobId = typeof body.job_id === 'string' ? body.job_id.trim() : '';
  const trimmedTitle = typeof body.title === 'string' ? body.title.trim() : '';

  if (!trimmedCustomerId) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Customer is required',
      },
      { status: 400 }
    );
  }

  if (!trimmedJobId) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Job is required',
      },
      { status: 400 }
    );
  }

  if (!trimmedTitle) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Change order title is required',
      },
      { status: 400 }
    );
  }

  const normalizedStatus =
    typeof body.status === 'string' && body.status.trim().length > 0
      ? body.status.trim()
      : 'draft';

  if (
    !VALID_CHANGE_ORDER_STATUSES.includes(
      normalizedStatus as (typeof VALID_CHANGE_ORDER_STATUSES)[number]
    )
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Invalid change order status',
      },
      { status: 400 }
    );
  }

  const laborCostParsed = parseNonNegativeNumber(body.labor_cost);
  const materialCostParsed = parseNonNegativeNumber(body.material_cost);
  const otherCostParsed = parseNonNegativeNumber(body.other_cost);
  const markupPercentParsed = parseNonNegativeNumber(body.markup_percent);
  const taxPercentParsed = parseNonNegativeNumber(body.tax_percent);

  const hasNegativeValue =
    laborCostParsed.isNegative ||
    materialCostParsed.isNegative ||
    otherCostParsed.isNegative ||
    markupPercentParsed.isNegative ||
    taxPercentParsed.isNegative;

  if (hasNegativeValue) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Costs and percentages cannot be negative',
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
        message: 'Failed to create change order',
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

  const { data: job, error: jobError } = await supabaseAdmin
    .from('jobs')
    .select('id')
    .eq('id', trimmedJobId)
    .eq('company_id', companyId)
    .maybeSingle();

  if (jobError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create change order',
        error: jobError.message,
      },
      { status: 500 }
    );
  }

  if (!job) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Job not found',
      },
      { status: 404 }
    );
  }

  const laborCost = laborCostParsed.value;
  const materialCost = materialCostParsed.value;
  const otherCost = otherCostParsed.value;
  const markupPercent = markupPercentParsed.value;
  const taxPercent = taxPercentParsed.value;

  const subtotalUnrounded = laborCost + materialCost + otherCost;
  const markupAmountUnrounded = subtotalUnrounded * (markupPercent / 100);
  const taxableAmount = subtotalUnrounded + markupAmountUnrounded;
  const taxAmountUnrounded = taxableAmount * (taxPercent / 100);
  const totalAmountUnrounded =
    subtotalUnrounded + markupAmountUnrounded + taxAmountUnrounded;

  const subtotal = roundToTwo(subtotalUnrounded);
  const markupAmount = roundToTwo(markupAmountUnrounded);
  const taxAmount = roundToTwo(taxAmountUnrounded);
  const totalAmount = roundToTwo(totalAmountUnrounded);

  const { data, error } = await supabaseAdmin
    .from('change_orders')
    .insert({
      company_id: companyId,
      customer_id: trimmedCustomerId,
      job_id: trimmedJobId,
      change_order_number: normalizeOptionalString(body.change_order_number),
      title: trimmedTitle,
      description: normalizeOptionalString(body.description),
      labor_cost: laborCost,
      material_cost: materialCost,
      other_cost: otherCost,
      markup_percent: markupPercent,
      tax_percent: taxPercent,
      subtotal,
      markup_amount: markupAmount,
      tax_amount: taxAmount,
      total_amount: totalAmount,
      status: normalizedStatus,
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create change order',
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, change_order: data });
}
