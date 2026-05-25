import { NextResponse } from 'next/server';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

type ChangeOrderSummaryRow = {
  id: string;
  status: string | null;
  total_amount: number | string | null;
  created_at: string | null;
};

function toSafeNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined) {
    return 0;
  }

  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
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
    .select('id, status, total_amount, created_at')
    .eq('company_id', companyId);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load dashboard summary',
        error: error.message,
      },
      { status: 500 }
    );
  }

  const rows = (data ?? []) as ChangeOrderSummaryRow[];

  let pendingApprovalAmount = 0;
  let approvedNotInvoicedAmount = 0;
  let rejectedAmount = 0;
  let totalDraftAmount = 0;
  let totalChangeOrderAmount = 0;

  for (const row of rows) {
    const amount = toSafeNumber(row.total_amount);
    totalChangeOrderAmount += amount;

    if (row.status === 'sent') {
      pendingApprovalAmount += amount;
    }

    if (row.status === 'approved') {
      approvedNotInvoicedAmount += amount;
    }

    if (row.status === 'rejected') {
      rejectedAmount += amount;
    }

    if (row.status === 'draft') {
      totalDraftAmount += amount;
    }
  }

  const recentChangeOrders = [...rows]
    .sort((a, b) => {
      const aTime = a.created_at ? new Date(a.created_at).getTime() : 0;
      const bTime = b.created_at ? new Date(b.created_at).getTime() : 0;
      return bTime - aTime;
    })
    .slice(0, 5)
    .map((row) => ({
      id: row.id,
      status: row.status,
      total_amount: toSafeNumber(row.total_amount),
      created_at: row.created_at,
    }));

  return NextResponse.json({
    ok: true,
    summary: {
      pendingApprovalAmount,
      approvedNotInvoicedAmount,
      rejectedAmount,
      totalChangeOrders: rows.length,
      totalDraftAmount,
      totalChangeOrderAmount,
      recentChangeOrders,
    },
  });
}
