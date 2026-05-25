import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ token: string }>;
};

type Decision = 'approved' | 'rejected';

type ApprovalLookupRecord = {
  id: string;
  status: string;
};

export async function GET(_request: Request, context: RouteContext) {
  const { token } = await context.params;

  const { data, error } = await supabaseAdmin
    .from('change_orders')
    .select(
      'id, change_order_number, title, description, labor_cost, material_cost, other_cost, markup_percent, tax_percent, subtotal, markup_amount, tax_amount, total_amount, status, sent_at, approved_at, rejected_at, created_at, customers(name, contact_name, email, phone, billing_address), jobs(name, job_number, address)'
    )
    .eq('approval_token', token)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load approval request',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Approval link not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, change_order: data });
}

async function handleDecision(request: Request, context: RouteContext) {
  const { token } = await context.params;
  const body = (await request.json()) as { decision?: string };

  if (body.decision !== 'approved' && body.decision !== 'rejected') {
    return NextResponse.json(
      {
        ok: false,
        message: 'Decision must be approved or rejected',
      },
      { status: 400 }
    );
  }

  const decision = body.decision as Decision;

  const { data: existing, error: lookupError } = await supabaseAdmin
    .from('change_orders')
    .select('id, status')
    .eq('approval_token', token)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load approval request',
        error: lookupError.message,
      },
      { status: 500 }
    );
  }

  if (!existing) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Approval link not found',
      },
      { status: 404 }
    );
  }

  const changeOrder = existing as ApprovalLookupRecord;

  if (
    changeOrder.status === 'approved' ||
    changeOrder.status === 'rejected' ||
    changeOrder.status === 'invoiced'
  ) {
    return NextResponse.json(
      {
        ok: false,
        message: 'This change order has already been finalized',
      },
      { status: 400 }
    );
  }

  const now = new Date().toISOString();

  const updatePayload =
    decision === 'approved'
      ? {
          status: 'approved',
          approved_at: now,
          rejected_at: null,
          updated_at: now,
        }
      : {
          status: 'rejected',
          rejected_at: now,
          approved_at: null,
          updated_at: now,
        };

  const { data: updated, error: updateError } = await supabaseAdmin
    .from('change_orders')
    .update(updatePayload)
    .eq('id', changeOrder.id)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to update approval decision',
        error: updateError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: decision === 'approved' ? 'Change order approved' : 'Change order rejected',
    change_order: updated,
  });
}

export async function POST(request: Request, context: RouteContext) {
  return handleDecision(request, context);
}

export async function PATCH(request: Request, context: RouteContext) {
  return handleDecision(request, context);
}
