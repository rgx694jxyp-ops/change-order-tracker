create table if not exists attachments (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  change_order_id uuid not null references change_orders(id) on delete cascade,
  file_name text not null,
  file_type text,
  file_size_bytes bigint,
  storage_bucket text not null,
  storage_path text not null,
  public_url text,
  uploaded_by text,
  created_at timestamptz not null default now(),
  check (file_size_bytes is null or file_size_bytes >= 0),
  check (length(trim(storage_bucket)) > 0),
  check (length(trim(storage_path)) > 0),
  check (length(trim(file_name)) > 0)
);

create index if not exists attachments_company_id_idx on attachments (company_id);
create index if not exists attachments_change_order_id_idx on attachments (change_order_id);
create index if not exists attachments_created_at_desc_idx on attachments (created_at desc);
create unique index if not exists attachments_storage_bucket_path_unique_idx
  on attachments (storage_bucket, storage_path);
