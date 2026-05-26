-- Protect customer records with row-level security by company membership.
-- This migration limits customer access to members of the associated company.

alter table public.customers enable row level security;

drop policy if exists "Company members can view customers" on public.customers;
create policy "Company members can view customers"
on public.customers
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Company members can create customers for their company" on public.customers;
create policy "Company members can create customers for their company"
on public.customers
for insert
to authenticated
with check (public.is_company_member(company_id));

drop policy if exists "Company members can update customers for their company" on public.customers;
create policy "Company members can update customers for their company"
on public.customers
for update
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "Company admins can delete customers for their company" on public.customers;
create policy "Company admins can delete customers for their company"
on public.customers
for delete
to authenticated
using (public.is_company_admin(company_id));
