import { NextResponse } from 'next/server';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

// Temporary development route. Remove after real onboarding is implemented.
const DEMO_COMPANY_ID = '00000000-0000-0000-0000-000000000001';

export async function POST() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ ok: false, message: 'Authentication required' }, { status: 401 });
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
    .select()
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

  const { data: company, error: companyError } = await supabaseAdmin
    .from('companies')
    .update({
      owner_user_id: user.id,
      slug: 'demo-contractor',
      billing_email: user.email ?? null,
    })
    .eq('id', DEMO_COMPANY_ID)
    .select()
    .single();

  if (companyError) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to update demo company owner',
        error: companyError.message,
      },
      { status: 500 }
    );
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('company_memberships')
    .upsert(
      {
        company_id: DEMO_COMPANY_ID,
        user_id: user.id,
        role: 'owner',
      },
      { onConflict: 'company_id,user_id' }
    )
    .select()
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
    message: 'Demo company linked to current user',
    profile,
    company,
    membership,
  });
}
