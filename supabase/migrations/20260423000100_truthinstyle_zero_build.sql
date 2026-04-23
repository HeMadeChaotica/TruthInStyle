-- TruthInStyle zero-build schema on deeperdaddy

create extension if not exists "pgcrypto";

create table if not exists section_registry (
  id uuid primary key default gen_random_uuid(),
  section_key text unique not null,
  section_title text not null,
  route_path text not null,
  nav_display_order int,
  is_home boolean default false,
  is_nav_item boolean default true,
  created_at timestamptz default now()
);

create table if not exists glyph_registry (
  id uuid primary key default gen_random_uuid(),
  glyph_key text unique not null,
  glyph_type text not null check (glyph_type in ('truth_wand_control', 'section_emblem_placeholder')),
  section_key text,
  asset_ref text,
  created_at timestamptz default now()
);

create table if not exists day_record (
  id uuid primary key default gen_random_uuid(),
  day_date date unique not null,
  title_of_day text,
  source_state text not null default 'open',
  synthesis_state text not null default 'pending',
  archive_state text not null default 'pending',
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists option_set_registry (
  id uuid primary key default gen_random_uuid(),
  option_set_key text unique not null,
  label text not null,
  home_section text not null,
  active boolean default true,
  display_order int not null,
  created_at timestamptz default now()
);

create table if not exists option_items (
  id uuid primary key default gen_random_uuid(),
  option_set_id uuid not null references option_set_registry(id) on delete cascade,
  item_value text not null,
  display_order int not null,
  active boolean default true,
  unique(option_set_id, item_value)
);

create table if not exists media_library (
  id uuid primary key default gen_random_uuid(),
  owner_day_id uuid references day_record(id) on delete set null,
  media_path text not null,
  media_type text not null,
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists assurer_assessment (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references day_record(id) on delete cascade,
  question_key text not null,
  answer_text text,
  option_set_key text,
  option_item_value text,
  libido_value text,
  created_at timestamptz default now()
);

create table if not exists assurer_writer (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references day_record(id) on delete cascade,
  entry_type text not null,
  content text not null,
  standout_excerpt boolean default false,
  created_at timestamptz default now()
);

create table if not exists da_eater_day (
  id uuid primary key default gen_random_uuid(),
  day_id uuid unique not null references day_record(id) on delete cascade,
  macros jsonb default '{}'::jsonb,
  progression_bars jsonb default '{}'::jsonb,
  meals jsonb default '[]'::jsonb,
  cheat_entries jsonb default '[]'::jsonb,
  water_oz numeric,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists thicc_fitt_day (
  id uuid primary key default gen_random_uuid(),
  day_id uuid unique not null references day_record(id) on delete cascade,
  exercise_log jsonb default '[]'::jsonb,
  cardio jsonb default '{}'::jsonb,
  notes text,
  performance_metrics jsonb default '{}'::jsonb,
  da_juice jsonb default '{}'::jsonb,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create table if not exists thicc_clients (
  id uuid primary key default gen_random_uuid(),
  display_name text not null,
  status text default 'active',
  notes text,
  created_at timestamptz default now()
);

create table if not exists thicc_client_logs (
  id uuid primary key default gen_random_uuid(),
  client_id uuid not null references thicc_clients(id) on delete cascade,
  logged_at timestamptz default now(),
  log_text text not null,
  media_id uuid references media_library(id) on delete set null,
  metadata jsonb default '{}'::jsonb
);

create table if not exists remember_me_calendar (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references day_record(id) on delete cascade,
  month_key text not null,
  entry_text text,
  created_at timestamptz default now()
);

create table if not exists remember_me_moments (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references day_record(id) on delete cascade,
  moment_type text not null check (moment_type in ('WOW', 'WTF', 'PLOT TWIST')),
  happened_at timestamptz,
  description text not null,
  media_id uuid references media_library(id) on delete set null,
  created_at timestamptz default now()
);

create table if not exists work_feed (
  id uuid primary key default gen_random_uuid(),
  day_id uuid unique not null references day_record(id) on delete cascade,
  work_signal text not null,
  notable_movement text,
  future_note text,
  created_at timestamptz default now()
);

create table if not exists summation_page (
  id uuid primary key default gen_random_uuid(),
  day_id uuid unique not null references day_record(id) on delete cascade,
  title_of_day text,
  rendered_page jsonb not null,
  searchable_text_snapshot text not null,
  archive_ready boolean default false,
  created_at timestamptz default now()
);

create table if not exists summation_fragments (
  id uuid primary key default gen_random_uuid(),
  summation_page_id uuid not null references summation_page(id) on delete cascade,
  fragment_group text not null,
  fragment_text text not null,
  source_bucket text not null,
  qualifier jsonb default '{}'::jsonb,
  created_at timestamptz default now()
);

create table if not exists summation_prompts (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references day_record(id) on delete cascade,
  prompt_order int not null,
  prompt_text text not null,
  answer_text text,
  created_at timestamptz default now(),
  unique(day_id, prompt_order)
);

create table if not exists hopewood_entries (
  id uuid primary key default gen_random_uuid(),
  day_id uuid unique not null references day_record(id) on delete cascade,
  summation_page_id uuid not null references summation_page(id) on delete cascade,
  title_of_day text,
  day_date date not null,
  mood text,
  era text,
  dropdown_qualifiers jsonb default '[]'::jsonb,
  keyword_phrases jsonb default '[]'::jsonb,
  trend_tags jsonb default '[]'::jsonb,
  searchable_text_snapshot text not null,
  created_at timestamptz default now()
);

create table if not exists hopewood_search_index (
  id uuid primary key default gen_random_uuid(),
  hopewood_entry_id uuid not null references hopewood_entries(id) on delete cascade,
  qualifier_key text not null,
  qualifier_value text not null,
  source_set text,
  searchable boolean default true,
  created_at timestamptz default now(),
  check (qualifier_key <> 'da_juice')
);

create table if not exists yearly_trend_cache (
  id uuid primary key default gen_random_uuid(),
  year int not null,
  source_rollup jsonb not null,
  hopewood_rollup jsonb not null,
  repeated_patterns jsonb not null,
  generated_at timestamptz default now(),
  unique(year)
);

create index if not exists idx_assurer_assessment_day on assurer_assessment(day_id);
create index if not exists idx_hopewood_entries_day_date on hopewood_entries(day_date desc);
create index if not exists idx_hopewood_search_index_qualifier on hopewood_search_index(qualifier_key, qualifier_value);
