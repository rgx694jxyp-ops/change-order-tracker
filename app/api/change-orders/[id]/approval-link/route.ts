import { NextResponse } from 'next/server';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

type RouteContext = {
  params: Promise<{ id: string }>;
};

type ChangeOrderApprovalRecord = {
  id: string;
  change_order_number: string | null;
  title: string;
  status: string;
  approval_token: string | null;
};

export async function POST(_request: Request, context: RouteContext) {
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

  const { data: changeOrder, error: loadError } = await supabaseAdmin
    .from('change_orders')
    .select('id, change_order_number, title, status, approval_token')
    .eq('id', id)
    .eq('company_id', companyId)
    .maybeSingle();

  if (loadError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load change order',
        error: loadError.message,
      },
      { status: 500 }
    );
  }

  if (!changeOrder) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Change order not found',
      },
      { status: 404 }
    );
  }

  const existing = changeOrder as ChangeOrderApprovalRecord;
  const approvalToken = existing.approval_token ?? crypto.randomUUID();
  const now = new Date().toISOString();

  const { data: updatedChangeOrder, error: updateError } = await supabaseAdmin
    .from('change_orders')
    .update({
      approval_token: approvalToken,
      status: 'sent',
      sent_at: now,
      updated_at: now,
    })
    .eq('id', id)
    .eq('company_id', companyId)
    .select('*')
    .single();

  if (updateError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to generate approval link',
        error: updateError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Approval link generated',
    approval_url: `/approve/${approvalToken}`,
    change_order: updatedChangeOrder,
  });
}
