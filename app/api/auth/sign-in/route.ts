import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

function isSafeInternalPath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

export async function POST(request: Request) {
  let body: unknown;

  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      { ok: false, message: 'Email and password are required' },
      { status: 400 }
    );
  }

  const email =
    typeof body === 'object' && body !== null && 'email' in body &&
    typeof (body as { email?: unknown }).email === 'string'
      ? (body as { email: string }).email.trim()
      : '';
  const password =
    typeof body === 'object' && body !== null && 'password' in body &&
    typeof (body as { password?: unknown }).password === 'string'
      ? (body as { password: string }).password
      : '';
  const next =
    typeof body === 'object' && body !== null && 'next' in body
      ? (body as { next?: unknown }).next
      : undefined;

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, message: 'Email and password are required' },
      { status: 400 }
    );
  }

  const supabase = await createSupabaseServerClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error || !data.user) {
    return NextResponse.json(
      { ok: false, message: error?.message ?? 'Sign-in failed' },
      { status: 401 }
    );
  }

  if (isSafeInternalPath(next)) {
    return NextResponse.redirect(new URL(next, request.url), { status: 303 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
}
