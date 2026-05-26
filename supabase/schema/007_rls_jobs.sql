-- Protect job records with row-level security by company membership.
-- This migration limits job access to members of the associated company.

alter table public.jobs enable row level security;

drop policy if exists "Company members can view jobs" on public.jobs;
create policy "Company members can view jobs"
on public.jobs
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Company members can create jobs for their company" on public.jobs;
create policy "Company members can create jobs for their company"
on public.jobs
for insert
to authenticated
with check (public.is_company_member(company_id));

drop policy if exists "Company members can update jobs for their company" on public.jobs;
create policy "Company members can update jobs for their company"
on public.jobs
for update
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "Company admins can delete jobs for their company" on public.jobs;
create policy "Company admins can delete jobs for their company"
on public.jobs
for delete
to authenticated
using (public.is_company_admin(company_id));
