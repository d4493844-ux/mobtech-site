/* ================================================================
   MOBTECH WORKSPACE — SUPABASE SQL
   Run this entire block in Supabase SQL Editor
   ================================================================ */

-- BRANDS (Gacom, VMS, Triangle Engine + any new ones)
create table if not exists brands (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  color text default '#00C8FF',
  icon text default '◆',
  created_at timestamptz default now()
);

-- EMPLOYEES
create table if not exists employees (
  id uuid default gen_random_uuid() primary key,
  username text unique not null,
  password_hash text not null,
  full_name text not null,
  role text,
  brand_id uuid references brands(id) on delete set null,
  avatar_color text default '#00C8FF',
  is_active boolean default true,
  last_seen timestamptz,
  created_at timestamptz default now()
);

-- TASKS
create table if not exists tasks (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  description text,
  brand_id uuid references brands(id) on delete cascade,
  assigned_to uuid references employees(id) on delete set null,
  created_by text default 'Admin',
  status text default 'todo' check (status in ('todo','inprogress','review','completed','blocked')),
  priority text default 'medium' check (priority in ('low','medium','high','urgent')),
  due_date date,
  completed_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TASK COMMENTS
create table if not exists task_comments (
  id uuid default gen_random_uuid() primary key,
  task_id uuid references tasks(id) on delete cascade,
  author text not null,
  author_type text default 'employee' check (author_type in ('admin','employee')),
  content text not null,
  created_at timestamptz default now()
);

-- DOCUMENTS
create table if not exists documents (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  description text,
  file_url text not null,
  file_type text,
  file_size bigint,
  brand_id uuid references brands(id) on delete set null,
  uploaded_by text default 'Admin',
  shared_with_all boolean default true,
  created_at timestamptz default now()
);

-- ANNOUNCEMENTS
create table if not exists announcements (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  content text not null,
  brand_id uuid references brands(id) on delete set null,
  priority text default 'normal' check (priority in ('normal','important','urgent')),
  created_by text default 'Admin',
  created_at timestamptz default now()
);

-- ACTIVITY LOG
create table if not exists activity_log (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade,
  action text not null,
  entity_type text,
  entity_id uuid,
  metadata jsonb,
  created_at timestamptz default now()
);

-- RLS Policies
alter table brands enable row level security;
alter table employees enable row level security;
alter table tasks enable row level security;
alter table task_comments enable row level security;
alter table documents enable row level security;
alter table announcements enable row level security;
alter table activity_log enable row level security;

-- Allow all for anon (auth handled client-side with admin password + employee password)
create policy "allow_all_brands" on brands for all using (true) with check (true);
create policy "allow_all_employees" on employees for all using (true) with check (true);
create policy "allow_all_tasks" on tasks for all using (true) with check (true);
create policy "allow_all_comments" on task_comments for all using (true) with check (true);
create policy "allow_all_documents" on documents for all using (true) with check (true);
create policy "allow_all_announcements" on announcements for all using (true) with check (true);
create policy "allow_all_activity" on activity_log for all using (true) with check (true);

-- Seed default brands
insert into brands (name, slug, color, icon) values
  ('Gacom', 'gacom', '#7C3AED', '◈'),
  ('VMS', 'vms', '#059669', '◉'),
  ('Triangle Engine', 'triangle-engine', '#DC2626', '△')
on conflict (slug) do nothing;

/* ================================================================
   SUPABASE STORAGE
   Go to Storage → New Bucket → name: "workspace-docs"
   Set to PUBLIC
   ================================================================ */

/* ================================================================
   ADD LEADER SUPPORT — run this in Supabase SQL Editor
   ================================================================ */

-- Add is_leader column to employees
alter table employees add column if not exists is_leader boolean default false;

-- Update existing leaders (Henshaw John and Henshaw James based on roles)
-- You can also do this from the admin dashboard after running this SQL

/* ================================================================
   LEADER ASSIGNMENTS — run in Supabase SQL Editor
   ================================================================ */

-- Table to track which employees a leader can assign tasks to
create table if not exists leader_assignments (
  id uuid default gen_random_uuid() primary key,
  leader_id uuid references employees(id) on delete cascade,
  member_id uuid references employees(id) on delete cascade,
  created_at timestamptz default now(),
  unique(leader_id, member_id)
);

alter table leader_assignments enable row level security;
create policy "allow_all_leader_assignments" on leader_assignments for all using (true) with check (true);
