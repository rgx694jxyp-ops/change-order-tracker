import { NextResponse } from 'next/server';

import { createSupabaseServerClient } from '@/lib/supabase/server';

function isSafeInternalPath(path: unknown): path is string {
  return typeof path === 'string' && path.startsWith('/') && !path.startsWith('//');
}

export async function POST(request: Request) {
  const contentType = request.headers.get('content-type')?.toLowerCase() ?? '';
  const isJsonRequest = contentType.includes('application/json');

  let rawEmail: unknown;
  let rawPassword: unknown;
  let rawNext: unknown;

  if (isJsonRequest) {
    let body: unknown;

    try {
      body = await request.json();
    } catch {
      body = null;
    }

    rawEmail =
      typeof body === 'object' && body !== null && 'email' in body
        ? (body as { email?: unknown }).email
        : undefined;
    rawPassword =
      typeof body === 'object' && body !== null && 'password' in body
        ? (body as { password?: unknown }).password
        : undefined;
    rawNext =
      typeof body === 'object' && body !== null && 'next' in body
        ? (body as { next?: unknown }).next
        : undefined;
  } else {
    let formData: FormData | null = null;

    try {
      formData = await request.formData();
    } catch {
      formData = null;
    }

    rawEmail = formData?.get('email') ?? undefined;
    rawPassword = formData?.get('password') ?? undefined;
    rawNext = formData?.get('next') ?? undefined;
  }

  const email = typeof rawEmail === 'string' ? rawEmail.trim() : '';
  const password = typeof rawPassword === 'string' ? rawPassword : '';
  const next = typeof rawNext === 'string' ? rawNext.trim() : undefined;

  if (!email || !password) {
    if (!isJsonRequest) {
      const url = new URL('/login', request.url);
      url.searchParams.set('error', 'Email and password are required');
      return NextResponse.redirect(url, { status: 303 });
    }

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
    if (!isJsonRequest) {
      const url = new URL('/login', request.url);
      url.searchParams.set('error', error?.message ?? 'Sign-in failed');
      return NextResponse.redirect(url, { status: 303 });
    }

    return NextResponse.json(
      { ok: false, message: error?.message ?? 'Sign-in failed' },
      { status: 401 }
    );
  }

  if (isSafeInternalPath(next)) {
    return NextResponse.redirect(new URL(next, request.url), { status: 303 });
  }

  if (!isJsonRequest) {
    return NextResponse.redirect(new URL('/dashboard', request.url), { status: 303 });
  }

  return NextResponse.json({
    ok: true,
    user: {
      id: data.user.id,
      email: data.user.email,
    },
  });
}
