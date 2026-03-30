-- ================================================================
-- MOBTECH COMPLETE SUPABASE SETUP
-- Run this entire block in Supabase SQL Editor
-- Safe to run even if some tables already exist
-- ================================================================

-- BLOG POSTS
create table if not exists blog_posts (
  id uuid default gen_random_uuid() primary key,
  title text not null,
  slug text unique not null,
  excerpt text,
  content text,
  cover_image text,
  published boolean default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

-- TEAM MEMBERS (public site)
create table if not exists team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  department text,
  bio text,
  image_url text,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- RLS
alter table blog_posts enable row level security;
alter table team_members enable row level security;

-- Policies (drop first to avoid duplicates)
drop policy if exists "Public read published posts" on blog_posts;
drop policy if exists "Admin all posts" on blog_posts;
drop policy if exists "Public read team" on team_members;
drop policy if exists "Admin all team" on team_members;

create policy "Public read published posts" on blog_posts for select using (published = true);
create policy "Admin all posts" on blog_posts for all using (true) with check (true);
create policy "Public read team" on team_members for select using (true);
create policy "Admin all team" on team_members for all using (true) with check (true);

-- Seed team members (only if table is empty)
insert into team_members (name, role, department, bio, image_url, display_order)
select * from (values
  ('Akinyemi Akinjide Samuel', 'Founder & CEO', 'Leadership',
   'Self-built entrepreneur and systems thinker. Started from Bells University of Technology, built websites to survive, and evolved into designing digital ecosystems. Author of The Power of Debt and Business Models. Driving Africa''s tech transformation through purpose-built innovation.',
   'https://res.cloudinary.com/drefakuj9/image/upload/v1774577980/WhatsApp_Image_2026-03-27_at_03.12.01_jwlakp.jpg',
   1),
  ('Odusote Oluwaseyi', 'General Manager', 'Leadership', null, null, 2),
  ('All Well Brown Tamunoibi', 'Assistant General Manager', 'Leadership', null, null, 3),
  ('Henshaw John', 'Managing Director', 'Gacom', null, null, 4),
  ('Henshaw James', 'Assistant Managing Director', 'Gacom', null, null, 5)
) as v(name, role, department, bio, image_url, display_order)
where not exists (select 1 from team_members limit 1);

-- ================================================================
-- WAITLIST FEATURE — add to Supabase SQL Editor
-- ================================================================

create table if not exists waitlists (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  slug text unique not null,
  description text,
  brand_id uuid references brands(id) on delete set null,
  is_open boolean default true,
  fields jsonb default '[{"key":"name","label":"Full Name","type":"text","required":true},{"key":"email","label":"Email Address","type":"email","required":true}]',
  thank_you_message text default 'You''re on the list! We''ll be in touch soon.',
  created_at timestamptz default now()
);

create table if not exists waitlist_entries (
  id uuid default gen_random_uuid() primary key,
  waitlist_id uuid references waitlists(id) on delete cascade,
  data jsonb not null,
  ip_hash text,
  created_at timestamptz default now()
);

alter table waitlists enable row level security;
alter table waitlist_entries enable row level security;

drop policy if exists "Public read open waitlists" on waitlists;
drop policy if exists "Admin all waitlists" on waitlists;
drop policy if exists "Public insert entries" on waitlist_entries;
drop policy if exists "Admin all entries" on waitlist_entries;

create policy "Public read open waitlists" on waitlists for select using (is_open = true);
create policy "Admin all waitlists" on waitlists for all using (true) with check (true);
create policy "Public insert entries" on waitlist_entries for insert with check (true);
create policy "Admin all entries" on waitlist_entries for all using (true) with check (true);

-- ================================================================
-- TASK DURATION — run in Supabase SQL Editor
-- ================================================================
alter table tasks add column if not exists duration_type text 
  check (duration_type in ('one-time','daily','weekly','monthly','custom')) default 'one-time';
alter table tasks add column if not exists duration_value integer default 1;
alter table tasks add column if not exists start_date date;

-- ================================================================
-- CHAT & NOTIFICATIONS — run in Supabase SQL Editor
-- ================================================================

-- CHAT ROOMS (group + DM)
create table if not exists chat_rooms (
  id uuid default gen_random_uuid() primary key,
  name text,
  type text not null check (type in ('direct','group','brand','hq')),
  brand_id uuid references brands(id) on delete cascade,
  created_by uuid references employees(id) on delete set null,
  created_at timestamptz default now()
);

-- ROOM MEMBERS
create table if not exists chat_members (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references chat_rooms(id) on delete cascade,
  employee_id uuid references employees(id) on delete cascade,
  last_read timestamptz default now(),
  created_at timestamptz default now(),
  unique(room_id, employee_id)
);

-- MESSAGES
create table if not exists chat_messages (
  id uuid default gen_random_uuid() primary key,
  room_id uuid references chat_rooms(id) on delete cascade,
  sender_id uuid references employees(id) on delete set null,
  sender_name text not null,
  content text not null,
  message_type text default 'text' check (message_type in ('text','file','system')),
  file_url text,
  file_name text,
  created_at timestamptz default now()
);

-- NOTIFICATIONS
create table if not exists notifications (
  id uuid default gen_random_uuid() primary key,
  employee_id uuid references employees(id) on delete cascade,
  type text not null check (type in ('message','task','announcement','mention')),
  title text not null,
  body text,
  link text,
  is_read boolean default false,
  created_at timestamptz default now()
);

-- RLS
alter table chat_rooms enable row level security;
alter table chat_members enable row level security;
alter table chat_messages enable row level security;
alter table notifications enable row level security;

drop policy if exists "allow_all_chat_rooms" on chat_rooms;
drop policy if exists "allow_all_chat_members" on chat_members;
drop policy if exists "allow_all_chat_messages" on chat_messages;
drop policy if exists "allow_all_notifications" on notifications;

create policy "allow_all_chat_rooms" on chat_rooms for all using (true) with check (true);
create policy "allow_all_chat_members" on chat_members for all using (true) with check (true);
create policy "allow_all_chat_messages" on chat_messages for all using (true) with check (true);
create policy "allow_all_notifications" on notifications for all using (true) with check (true);

-- Enable realtime on messages and notifications
alter publication supabase_realtime add table chat_messages;
alter publication supabase_realtime add table notifications;
