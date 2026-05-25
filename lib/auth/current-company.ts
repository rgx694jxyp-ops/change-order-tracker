import 'server-only';

import { supabaseAdmin } from '@/lib/supabase/admin';
import { createSupabaseServerClient } from '@/lib/supabase/server';

export type CurrentCompanyContext = {
  userId: string;
  userEmail: string | null;
  companyId: string;
  role: 'owner' | 'admin' | 'member';
};

type CurrentCompanyContextResult =
  | {
      ok: true;
      context: CurrentCompanyContext;
    }
  | {
      ok: false;
      status: 401 | 404 | 500;
      message: string;
      error?: string;
    };

export async function getCurrentCompanyContext(): Promise<CurrentCompanyContextResult> {
  const supabase = await createSupabaseServerClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return {
      ok: false,
      status: 401,
      message: 'Authentication required',
    };
  }

  const { data: membership, error: membershipError } = await supabaseAdmin
    .from('company_memberships')
    .select('company_id, role')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (membershipError) {
    return {
      ok: false,
      status: 500,
      message: 'Failed to load company membership',
      error: membershipError.message,
    };
  }

  if (!membership) {
    return {
      ok: false,
      status: 404,
      message: 'No company membership found',
    };
  }

  if (membership.role !== 'owner' && membership.role !== 'admin' && membership.role !== 'member') {
    return {
      ok: false,
      status: 500,
      message: 'Failed to load company membership',
      error: 'Invalid company membership role',
    };
  }

  return {
    ok: true,
    context: {
      userId: user.id,
      userEmail: user.email ?? null,
      companyId: membership.company_id,
      role: membership.role,
    },
  };
}
