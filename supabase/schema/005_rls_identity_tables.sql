-- Protect company identity tables with row-level security policies.
-- This migration enables RLS only for identity and ownership tables.

alter table public.companies enable row level security;
alter table public.user_profiles enable row level security;
alter table public.company_memberships enable row level security;

-- public.user_profiles

drop policy if exists "Users can view their own profile" on public.user_profiles;
create policy "Users can view their own profile"
on public.user_profiles
for select
to authenticated
using (user_id = auth.uid());

drop policy if exists "Users can update their own profile" on public.user_profiles;
create policy "Users can update their own profile"
on public.user_profiles
for update
to authenticated
using (user_id = auth.uid())
with check (user_id = auth.uid());

-- public.company_memberships

drop policy if exists "Users can view memberships for companies they belong to" on public.company_memberships;
create policy "Users can view memberships for companies they belong to"
on public.company_memberships
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Company admins can manage memberships for their companies" on public.company_memberships;
create policy "Company admins can manage memberships for their companies"
on public.company_memberships
for insert
to authenticated
with check (public.is_company_admin(company_id));

drop policy if exists "Company admins can update memberships for their companies" on public.company_memberships;
create policy "Company admins can update memberships for their companies"
on public.company_memberships
for update
to authenticated
using (public.is_company_admin(company_id))
with check (public.is_company_admin(company_id));

drop policy if exists "Company admins can delete memberships for their companies" on public.company_memberships;
create policy "Company admins can delete memberships for their companies"
on public.company_memberships
for delete
to authenticated
using (public.is_company_admin(company_id));

-- public.companies

drop policy if exists "Users can view companies they belong to" on public.companies;
create policy "Users can view companies they belong to"
on public.companies
for select
to authenticated
using (public.is_company_member(id));

drop policy if exists "Company admins can update their company" on public.companies;
create policy "Company admins can update their company"
on public.companies
for update
to authenticated
using (public.is_company_admin(id))
with check (public.is_company_admin(id));
