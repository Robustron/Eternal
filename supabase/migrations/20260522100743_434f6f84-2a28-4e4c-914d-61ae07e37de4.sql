ALTER TABLE public.entries
  ADD COLUMN IF NOT EXISTS day_key date NOT NULL DEFAULT ((now() AT TIME ZONE 'UTC') - interval '2 hours')::date;

CREATE INDEX IF NOT EXISTS entries_day_key_idx ON public.entries (day_key);