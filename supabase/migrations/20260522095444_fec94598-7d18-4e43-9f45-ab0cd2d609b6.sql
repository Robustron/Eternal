create or replace function public.enforce_lock()
returns trigger
language plpgsql
set search_path = public
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