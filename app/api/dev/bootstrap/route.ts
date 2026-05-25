import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';

// Temporary development route: remove or replace this after authentication is added.
const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';
const DEMO_COMPANY_NAME = 'Demo Contractor';

export async function GET() {
  const { data: existingCompany, error: lookupError } = await supabaseAdmin
    .from('companies')
    .select('*')
    .eq('id', DEMO_COMPANY_ID)
    .maybeSingle();

  if (lookupError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Demo company bootstrap failed',
        error: lookupError.message,
      },
      { status: 500 }
    );
  }

  if (existingCompany) {
    return NextResponse.json({
      ok: true,
      message: 'Demo company already exists',
      company: existingCompany,
    });
  }

  const { data: createdCompany, error: insertError } = await supabaseAdmin
    .from('companies')
    .insert({
      id: DEMO_COMPANY_ID,
      name: DEMO_COMPANY_NAME,
      default_markup_percent: 15,
      default_tax_percent: 0,
    })
    .select('*')
    .single();

  if (insertError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Demo company bootstrap failed',
        error: insertError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Demo company created',
    company: createdCompany,
  });
}
