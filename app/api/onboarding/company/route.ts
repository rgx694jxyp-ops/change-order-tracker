import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

type OnboardingBody = {
  company_name?: unknown;
  billing_email?: unknown;
  phone?: unknown;
  address?: unknown;
};

function normalizeOptionalString(value: unknown) {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  return trimmed.length > 0 ? trimmed : null;
}

function createCompanySlug(companyName: string) {
  const baseSlug = companyName
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');

  const normalizedBase = baseSlug.length > 0 ? baseSlug : 'company';
  const suffix = crypto.randomUUID().slice(0, 8);

  return `${normalizedBase}-${suffix}`;
}

export async function POST(request: Request) {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Authentication required',
      },
      { status: 401 }
    );
  }

  const body = (await request.json()) as OnboardingBody;

  const companyName = typeof body.company_name === 'string' ? body.company_name.trim() : '';

  if (!companyName) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Company name is required',
      },
      { status: 400 }
    );
  }

  const { data: existingMembership, error: membershipLookupError } = await supabaseAdmin
    .from('company_memberships')
    .select('id')
    .eq('user_id', user.id)
    .limit(1)
    .maybeSingle();

  if (membershipLookupError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to check company membership',
        error: membershipLookupError.message,
      },
      { status: 500 }
    );
  }

  if (existingMembership) {
    return NextResponse.json(
      {
        ok: false,
        message: 'User already belongs to a company',
      },
      { status: 409 }
    );
  }

  const billingEmail = normalizeOptionalString(body.billing_email) ?? user.email ?? null;
  const slug = createCompanySlug(companyName);

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .insert({
      name: companyName,
      owner_user_id: user.id,
      billing_email: billingEmail,
      email: billingEmail,
      phone: normalizeOptionalString(body.phone),
      address: normalizeOptionalString(body.address),
      slug,
      timezone: 'America/Chicago',
      default_markup_percent: 15,
      default_tax_percent: 0,
      plan: 'starter',
      subscription_status: 'trialing',
    })
    .select('*')
    .single();

  if (companyError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create company',
        error: companyError.message,
      },
      { status: 500 }
    );
  }

  const { data: profile, error: profileError } = await supabaseAdmin
    .from('user_profiles')
    .upsert(
      {
        user_id: user.id,
        email: user.email ?? null,
        full_name: user.user_metadata?.full_name ?? null,
      },
      { onConflict: 'user_id' }
    )
    .select('*')
    .single();

  if (profileError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create user profile',
        error: profileError.message,
      },
      { status: 500 }
    );
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('company_memberships')
    .insert({
      company_id: company.id,
      user_id: user.id,
      role: 'owner',
    })
    .select('*')
    .single();

  if (membershipError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to create company membership',
        error: membershipError.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Company created',
    company,
    profile,
    membership,
  });
}
