-- RLS helper functions for company-scoped access checks.
-- These functions are intended to be referenced by future row-level security policies.

create or replace function public.current_user_company_ids()
returns setof uuid
language sql
stable
security definer
set search_path = public
as $$
  select company_id
  from public.company_memberships
  where user_id = auth.uid();
$$;

comment on function public.current_user_company_ids()
  is 'RLS helper function that returns company ids for the authenticated user.';

create or replace function public.is_company_member(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships
    where company_id = target_company_id
      and user_id = auth.uid()
  );
$$;

comment on function public.is_company_member(uuid)
  is 'RLS helper function that checks whether the authenticated user belongs to a company.';

create or replace function public.is_company_admin(target_company_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.company_memberships
    where company_id = target_company_id
      and user_id = auth.uid()
      and role in ('owner', 'admin')
  );
$$;

comment on function public.is_company_admin(uuid)
  is 'RLS helper function that checks whether the authenticated user is an owner or admin for a company.';

grant execute on function public.current_user_company_ids() to authenticated;
grant execute on function public.is_company_member(uuid) to authenticated;
grant execute on function public.is_company_admin(uuid) to authenticated;

revoke execute on function public.current_user_company_ids() from anon;
revoke execute on function public.is_company_member(uuid) from anon;
revoke execute on function public.is_company_admin(uuid) from anon;
