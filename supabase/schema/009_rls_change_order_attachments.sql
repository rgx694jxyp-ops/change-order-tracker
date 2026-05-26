-- Protect change order attachment metadata with row-level security by company membership.
-- This migration limits authenticated metadata access to members of the associated company.
-- Storage bucket privacy and signed URL access are handled separately and remain unchanged here.

alter table public.attachments enable row level security;

drop policy if exists "Company members can view attachment metadata" on public.attachments;
create policy "Company members can view attachment metadata"
on public.attachments
for select
to authenticated
using (public.is_company_member(company_id));

drop policy if exists "Company members can create attachment metadata for their company" on public.attachments;
create policy "Company members can create attachment metadata for their company"
on public.attachments
for insert
to authenticated
with check (public.is_company_member(company_id));

drop policy if exists "Company members can update attachment metadata for their company" on public.attachments;
create policy "Company members can update attachment metadata for their company"
on public.attachments
for update
to authenticated
using (public.is_company_member(company_id))
with check (public.is_company_member(company_id));

drop policy if exists "Company admins can delete attachment metadata for their company" on public.attachments;
create policy "Company admins can delete attachment metadata for their company"
on public.attachments
for delete
to authenticated
using (public.is_company_admin(company_id));
