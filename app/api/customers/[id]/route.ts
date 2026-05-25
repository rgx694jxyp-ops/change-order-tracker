import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';

const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

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
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .select('id, name, contact_name, email, phone, billing_address, notes, created_at')
    .eq('id', id)
    .eq('company_id', DEMO_COMPANY_ID)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load customer',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Customer not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, customer: data });
}

export async function PATCH(request: Request, context: RouteContext) {
  const { id } = await context.params;
  const body = await request.json();
  const trimmedName = typeof body.name === 'string' ? body.name.trim() : '';

  if (!trimmedName) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Customer name is required',
      },
      { status: 400 }
    );
  }

  const { data, error } = await supabaseAdmin
    .from('customers')
    .update({
      name: trimmedName,
      contact_name: normalizeOptionalString(body.contact_name),
      email: normalizeOptionalString(body.email),
      phone: normalizeOptionalString(body.phone),
      billing_address: normalizeOptionalString(body.billing_address),
      notes: normalizeOptionalString(body.notes),
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)
    .eq('company_id', DEMO_COMPANY_ID)
    .select('id, name, contact_name, email, phone, billing_address, notes, created_at')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to update customer',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Customer not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, customer: data });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const { id } = await context.params;

  const { data, error } = await supabaseAdmin
    .from('customers')
    .delete()
    .eq('id', id)
    .eq('company_id', DEMO_COMPANY_ID)
    .select('id')
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to delete customer',
        error: error.message,
      },
      { status: 500 }
    );
  }

  if (!data) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Customer not found',
      },
      { status: 404 }
    );
  }

  return NextResponse.json({ ok: true, message: 'Customer deleted' });
}
