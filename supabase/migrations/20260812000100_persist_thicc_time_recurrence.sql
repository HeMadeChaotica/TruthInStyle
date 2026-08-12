-- Persist the complete THICC.TIME calendar record rather than dropping
-- recurrence and display-layer fields during the Supabase write.  The
-- production project predates the original THICC.TIME migration, so create
-- the missing table before adding the newer fields.
create table if not exists public.thicc_client_schedule_entries (
  id uuid primary key default gen_random_uuid(),
  client_id uuid references public.thicc_clients(id) on delete set null,
  client_name text,
  entry_type text not null default 'personal',
  schedule_layer text,
  entry_date date not null,
  start_time time,
  end_time time,
  workout_label text,
  source_split_day text,
  prospect_name text,
  prospect_contact text,
  location text,
  notes text,
  color_option_key text,
  recurrence_type text not null default 'none',
  recurrence_days text[] not null default '{}'::text[],
  recurrence_active boolean not null default false,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

alter table public.thicc_client_schedule_entries
  add column if not exists schedule_layer text,
  add column if not exists prospect_name text,
  add column if not exists prospect_contact text,
  add column if not exists recurrence_type text not null default 'none',
  add column if not exists recurrence_days text[] not null default '{}'::text[],
  add column if not exists recurrence_active boolean not null default false;
