
create table public.entries (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page in ('pink','blue')),
  content text not null default '',
  locked boolean not null default false,
  locked_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index entries_page_created_idx on public.entries (page, created_at);

alter table public.entries enable row level security;

create policy "anyone can read entries"
  on public.entries for select
  using (true);

create policy "anyone can insert drafts"
  on public.entries for insert
  with check (locked = false);

create policy "anyone can update unlocked entries"
  on public.entries for update
  using (locked = false);

-- Trigger: once locked, no field can change. Also stamp locked_at + updated_at.
create or replace function public.enforce_lock()
returns trigger
language plpgsql
as $$
begin
  if old.locked = true then
    raise exception 'Locked entries are permanent and cannot be modified';
  end if;
  if new.locked = true and old.locked = false then
    new.locked_at := now();
  end if;
  new.updated_at := now();
  return new;
end;
$$;

create trigger entries_enforce_lock
  before update on public.entries
  for each row execute function public.enforce_lock();

-- Prevent deletion entirely (drafts and locked).
create policy "no deletes" on public.entries for delete using (false);

-- Realtime
alter table public.entries replica identity full;
alter publication supabase_realtime add table public.entries;
