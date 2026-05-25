-- user_profiles stores app-specific user details.
-- company_memberships connects Supabase auth users to companies.
-- The existing demo company id will be replaced by authenticated company lookup in future app routes.

alter table if exists companies
  add column if not exists owner_user_id uuid references auth.users(id) on delete set null;

alter table if exists companies
  add column if not exists slug text;

alter table if exists companies
  add column if not exists timezone text not null default 'America/Chicago';

alter table if exists companies
  add column if not exists billing_email text;

alter table if exists companies
  add column if not exists logo_url text;

alter table if exists companies
  add column if not exists stripe_customer_id text;

alter table if exists companies
  add column if not exists stripe_subscription_id text;

alter table if exists companies
  add column if not exists plan text not null default 'starter';

alter table if exists companies
  add column if not exists subscription_status text not null default 'trialing';

alter table if exists companies
  add column if not exists current_period_end timestamptz;

create index if not exists companies_owner_user_id_idx on companies (owner_user_id);

create unique index if not exists companies_slug_unique_idx
  on companies (lower(slug))
  where slug is not null;

create index if not exists companies_stripe_customer_id_idx
  on companies (stripe_customer_id)
  where stripe_customer_id is not null;

create table if not exists user_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists user_profiles_user_id_idx on user_profiles (user_id);

create index if not exists user_profiles_email_idx
  on user_profiles (lower(email))
  where email is not null;

create table if not exists company_memberships (
  id uuid primary key default gen_random_uuid(),
  company_id uuid not null references companies(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null default 'owner',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists company_memberships_company_id_idx on company_memberships (company_id);
create index if not exists company_memberships_user_id_idx on company_memberships (user_id);
create index if not exists company_memberships_company_user_idx on company_memberships (company_id, user_id);

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'company_memberships_company_user_unique'
  ) THEN
    ALTER TABLE company_memberships
      ADD CONSTRAINT company_memberships_company_user_unique
      UNIQUE (company_id, user_id);
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_plan_check'
  ) THEN
    ALTER TABLE companies
      ADD CONSTRAINT companies_plan_check
      CHECK (plan IN ('starter', 'pro', 'business'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'companies_subscription_status_check'
  ) THEN
    ALTER TABLE companies
      ADD CONSTRAINT companies_subscription_status_check
      CHECK (subscription_status IN ('trialing', 'active', 'past_due', 'canceled', 'unpaid'));
  END IF;
END $$;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'company_memberships_role_check'
  ) THEN
    ALTER TABLE company_memberships
      ADD CONSTRAINT company_memberships_role_check
      CHECK (role IN ('owner', 'admin', 'member'));
  END IF;
END $$;
