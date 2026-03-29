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
