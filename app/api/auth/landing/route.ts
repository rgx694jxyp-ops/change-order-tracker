import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';
import { supabaseAdmin } from '@/lib/supabase/admin';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

const noStoreHeaders = {
  'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate',
  Pragma: 'no-cache',
  Expires: '0',
};

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json(
      {
        ok: true,
        authenticated: false,
        next: '/login',
        hasCompany: false,
      },
      { headers: noStoreHeaders }
    );
  }

  const { data: membership, error } = await supabaseAdmin
    .from('company_memberships')
    .select('company_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Failed to check company membership',
        error: error.message,
      },
      { status: 500, headers: noStoreHeaders }
    );
  }

  if (!membership) {
    return NextResponse.json(
      {
        ok: true,
        authenticated: true,
        next: '/onboarding/company',
        hasCompany: false,
        user: {
          id: user.id,
          email: user.email,
        },
      },
      { headers: noStoreHeaders }
    );
  }

  return NextResponse.json(
    {
      ok: true,
      authenticated: true,
      next: '/dashboard',
      hasCompany: true,
      user: {
        id: user.id,
        email: user.email,
      },
      company: {
        id: membership.company_id,
        role: membership.role,
      },
    },
    { headers: noStoreHeaders }
  );
}
