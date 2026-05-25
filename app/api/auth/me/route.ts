import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.getUser();

  if (error || !data.user) {
    return NextResponse.json({
      ok: true,
      authenticated: false,
      user: null,
    });
  }

  return NextResponse.json({
    ok: true,
    authenticated: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
}
