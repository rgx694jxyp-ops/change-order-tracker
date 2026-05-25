create table if not exists companies (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  phone text,
  email text,
  address text,
  default_markup_percent numeric(8,2) not null default 0 check (default_markup_percent >= 0),
  default_tax_percent numeric(8,2) not null default 0 check (default_tax_percent >= 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists customers (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  name text not null,
  contact_name text,
  email text,
  phone text,
  billing_address text,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists jobs (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  name text not null,
  job_number text,
  address text,
  description text,
  status text not null default 'active' check (status in ('active', 'completed', 'archived')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists change_orders (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  customer_id uuid not null references customers(id) on delete cascade,
  job_id uuid not null references jobs(id) on delete cascade,
  change_order_number text,
  title text not null,
  description text,
  labor_cost numeric(12,2) not null default 0 check (labor_cost >= 0),
  material_cost numeric(12,2) not null default 0 check (material_cost >= 0),
  other_cost numeric(12,2) not null default 0 check (other_cost >= 0),
  markup_percent numeric(8,2) not null default 0 check (markup_percent >= 0),
  tax_percent numeric(8,2) not null default 0 check (tax_percent >= 0),
  subtotal numeric(12,2) not null default 0 check (subtotal >= 0),
  markup_amount numeric(12,2) not null default 0 check (markup_amount >= 0),
  tax_amount numeric(12,2) not null default 0 check (tax_amount >= 0),
  total_amount numeric(12,2) not null default 0 check (total_amount >= 0),
  status text not null default 'draft' check (status in ('draft', 'sent', 'approved', 'rejected', 'invoiced')),
  approval_token text,
  sent_at timestamptz,
  approved_at timestamptz,
  rejected_at timestamptz,
  invoiced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists customers_company_id_idx on customers (company_id);
create index if not exists jobs_company_id_idx on jobs (company_id);
create index if not exists jobs_customer_id_idx on jobs (customer_id);
create index if not exists change_orders_company_id_idx on change_orders (company_id);
create index if not exists change_orders_customer_id_idx on change_orders (customer_id);
create index if not exists change_orders_job_id_idx on change_orders (job_id);
create index if not exists change_orders_status_idx on change_orders (status);
create unique index if not exists change_orders_approval_token_unique_idx
  on change_orders (approval_token)
  where approval_token is not null;

create index if not exists change_orders_company_change_order_number_idx
  on change_orders (company_id, change_order_number);
