import { NextResponse } from 'next/server';

import { supabase } from '@/lib/supabase/client';

export async function GET() {
  const { error } = await supabase.from('companies').select('id').limit(1);

  if (error) {
    return NextResponse.json(
      {
        ok: false,
        message: 'Supabase connection failed',
        error: error.message,
      },
      { status: 500 }
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'Supabase connection successful',
  });
}
