-- CKAVOX WEBSITE DATABASE SETUP
-- Run this script in Supabase SQL Editor.

create extension if not exists pgcrypto;

create table if not exists public.stories (
  id uuid primary key default gen_random_uuid(),

  title text not null
    check (char_length(title) between 1 and 140),

  category text not null
    check (
      category in (
        'films',
        'sports',
        'technology',
        'showbiz',
        'news',
        'music'
      )
    ),

  image_url text not null,
  article_url text not null,

  description text not null
    check (char_length(description) between 1 and 800),

  published boolean not null default true,

  created_by uuid references auth.users(id)
    on delete set null,

  created_at timestamptz not null default now()
);

alter table public.stories enable row level security;

-- Public visitors can read published stories.
-- The authorized admin can also read unpublished stories.

drop policy if exists
"Anyone can read published CKAVOX stories"
on public.stories;

create policy "Anyone can read published CKAVOX stories"
on public.stories
for select
to anon, authenticated
using (
  published = true
  or lower(coalesce(auth.jwt() ->> 'email', ''))
    = 'cedrickkayiranga354@gmail.com'
);

-- Only the authorized admin can create stories.

drop policy if exists
"CKAVOX admin can insert stories"
on public.stories;

create policy "CKAVOX admin can insert stories"
on public.stories
for insert
to authenticated
with check (
  lower(coalesce(auth.jwt() ->> 'email', ''))
    = 'cedrickkayiranga354@gmail.com'
  and created_by = auth.uid()
);

-- Only the authorized admin can update stories.

drop policy if exists
"CKAVOX admin can update stories"
on public.stories;

create policy "CKAVOX admin can update stories"
on public.stories
for update
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', ''))
    = 'cedrickkayiranga354@gmail.com'
)
with check (
  lower(coalesce(auth.jwt() ->> 'email', ''))
    = 'cedrickkayiranga354@gmail.com'
);

-- Only the authorized admin can delete stories.

drop policy if exists
"CKAVOX admin can delete stories"
on public.stories;

create policy "CKAVOX admin can delete stories"
on public.stories
for delete
to authenticated
using (
  lower(coalesce(auth.jwt() ->> 'email', ''))
    = 'cedrickkayiranga354@gmail.com'
);

grant select on public.stories to anon, authenticated;

grant insert, update, delete
on public.stories
to authenticated;
