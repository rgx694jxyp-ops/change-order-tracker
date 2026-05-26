-- Protect change order records with row-level security by company membership.
-- This migration limits authenticated change order access to members of the associated company.
-- Public approval token flows remain unchanged because they use server-side access and token lookup.

alter table public.change_orders enable row level security;

drop policy if exists "Company members can view change orders" on public.change_orders;
create policy "Company members can view change orders"
on public.change_orders
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Company members can create change orders for their company" on public.change_orders;
create policy "Company members can create change orders for their company"
on public.change_orders
for insert
to authenticated
with check (public.is_company_member(company_id));

drop policy if exists "Company members can update change orders for their company" on public.change_orders;
create policy "Company members can update change orders for their company"
on public.change_orders
for update
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "Company admins can delete change orders for their company" on public.change_orders;
create policy "Company admins can delete change orders for their company"
on public.change_orders
for delete
to authenticated
using (public.is_company_admin(company_id));
