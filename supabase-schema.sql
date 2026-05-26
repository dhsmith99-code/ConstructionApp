-- Foreman Construction App — Supabase Schema
-- Run this in the Supabase SQL Editor: https://supabase.com/dashboard/project/bslxdhtidqqykukaspel/sql

-- Projects
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  status text default 'planning',
  client text,
  address text,
  budget text,
  notes text,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Photos
create table if not exists photos (
  id uuid primary key default gen_random_uuid(),
  url text not null,
  caption text,
  project_id uuid references projects(id) on delete cascade,
  created_date timestamptz default now()
);

-- Punch Items
create table if not exists punch_items (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  project_id uuid references projects(id) on delete cascade,
  assigned_to text,
  status text default 'open',
  completed_date date,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Plans
create table if not exists plans (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  file_url text,
  description text,
  project_id uuid references projects(id) on delete cascade,
  created_date timestamptz default now()
);

-- Purchase Orders
create table if not exists purchase_orders (
  id uuid primary key default gen_random_uuid(),
  vendor text not null,
  description text,
  amount numeric,
  status text default 'pending',
  order_date date,
  project_id uuid references projects(id) on delete cascade,
  created_date timestamptz default now(),
  updated_date timestamptz default now()
);

-- Selections
create table if not exists selections (
  id uuid primary key default gen_random_uuid(),
  category text,
  item text not null,
  notes text,
  status text default 'pending',
  project_id uuid references projects(id) on delete cascade,
  created_date timestamptz default now()
);

-- Schedule Tasks
create table if not exists schedule_tasks (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  description text,
  start_date date,
  duration_days integer default 1,
  trade text default 'general',
  assignee text,
  color text default '#FBBF24',
  project_id uuid references projects(id) on delete cascade,
  created_date timestamptz default now()
);

-- Job Files
create table if not exists job_files (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text default 'other',
  file_url text,
  description text,
  project_id uuid references projects(id) on delete cascade,
  created_date timestamptz default now()
);

-- Sales Lead columns on projects
alter table projects
  add column if not exists salesperson text,
  add column if not exists lead_source text,
  add column if not exists lead_status text default 'prospect',
  add column if not exists estimated_value text,
  add column if not exists contact_phone text,
  add column if not exists contact_email text,
  add column if not exists lead_notes text;

-- Disable Row Level Security (app has no auth layer)
alter table projects disable row level security;
alter table photos disable row level security;
alter table punch_items disable row level security;
alter table plans disable row level security;
alter table purchase_orders disable row level security;
alter table selections disable row level security;
alter table schedule_tasks disable row level security;
alter table job_files disable row level security;
