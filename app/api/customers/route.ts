import { NextResponse } from 'next/server';

import { getCurrentCompanyContext } from '@/lib/auth/current-company';
import { supabaseAdmin } from '@/lib/supabase/admin';

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
    .from('customers')
    .select('id, name, contact_name, email, phone, billing_address, notes, created_at')
    .eq('company_id', companyId)
    .order('created_at', { ascending: false });

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to load customers',
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, customers: data });
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
    .insert({
      company_id: companyId,
      name: trimmedName,
      contact_name: normalizeOptionalString(body.contact_name),
      email: normalizeOptionalString(body.email),
      phone: normalizeOptionalString(body.phone),
      billing_address: normalizeOptionalString(body.billing_address),
      notes: normalizeOptionalString(body.notes),
    })
    .select('*')
    .single();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create customer',
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({ ok: true, customer: data });
}
