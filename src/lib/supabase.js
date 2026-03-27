import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseKey)

/* ============================================================
   SUPABASE SQL — run this in your Supabase SQL Editor once
   ============================================================

-- TEAM MEMBERS TABLE
create table team_members (
  id uuid default gen_random_uuid() primary key,
  name text not null,
  role text not null,
  department text,
  bio text,
  image_url text,
  display_order integer default 0,
  created_at timestamptz default now()
);

-- BLOG POSTS TABLE
create table blog_posts (
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

-- Enable public read access
alter table team_members enable row level security;
alter table blog_posts enable row level security;

create policy "Public read team" on team_members for select using (true);
create policy "Public read published posts" on blog_posts for select using (published = true);

-- Allow all operations (admin uses anon key — secure with VITE_ADMIN_PASSWORD check client-side)
create policy "Admin all team" on team_members for all using (true) with check (true);
create policy "Admin all posts" on blog_posts for all using (true) with check (true);

-- SEED initial team members
insert into team_members (name, role, department, display_order) values
  ('Akinyemi Akinjide', 'Founder & CEO', 'Leadership', 1),
  ('Odusote Oluwaseyi', 'General Manager', 'Leadership', 2),
  ('All Well Brown Tamunoibi', 'Assistant General Manager', 'Leadership', 3),
  ('Henshaw John', 'Managing Director', 'Gacom', 4),
  ('Henshaw James', 'Assistant Managing Director', 'Gacom', 5);

============================================================ */
