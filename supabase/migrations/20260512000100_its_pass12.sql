-- ITS PASS 1+2 schema extension
create table if not exists public.thicc_client_profiles (
  client_id text primary key references public.thicc_clients(id) on delete cascade,
  profile_photo_media_id text,
  sex text,
  sexual_orientation text,
  height text,
  age integer,
  email text,
  relationship_status text,
  current_weight numeric,
  goal_weight numeric,
  current_bmi numeric,
  goal_bmi numeric,
  emergency_contact_name text,
  emergency_contact_phone text,
  injuries_notes text,
  surgeries_notes text,
  allergies_notes text,
  medications_notes text,
  physical_limitations text,
  painful_movements text,
  flexibility_level text,
  hard_nos text,
  training_fears text,
  food_block_json jsonb default '{}'::jsonb,
  movement_block_json jsonb default '{}'::jsonb,
  medical_block_json jsonb default '{}'::jsonb,
  thicc_thoughts text,
  client_color_option_key text,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);
create table if not exists public.thicc_client_program_splits (id uuid primary key default gen_random_uuid(),client_id text not null references public.thicc_clients(id) on delete cascade,version_label text,is_active boolean default true,split_days_json jsonb default '[]'::jsonb,training_rest_days_json jsonb default '[]'::jsonb,seasons_per_week integer,start_date date,end_date date,notes text,created_at timestamptz default now());
create table if not exists public.thicc_client_schedule_entries (id uuid primary key default gen_random_uuid(),client_id text references public.thicc_clients(id) on delete set null,entry_type text not null,entry_date date not null,start_time time,end_time time,workout_label text,source_split_day text,location text,notes text,color_option_key text,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.thicc_client_forms (id uuid primary key default gen_random_uuid(),form_key text unique,form_name text not null,form_category text,form_schema_json jsonb default '{}'::jsonb,is_template boolean default true,active boolean default true,created_at timestamptz default now(),updated_at timestamptz default now());
create table if not exists public.thicc_client_form_assignments (id uuid primary key default gen_random_uuid(),client_id text not null references public.thicc_clients(id) on delete cascade,form_id uuid not null references public.thicc_client_forms(id) on delete cascade,status text not null default 'assigned',assigned_at timestamptz default now(),completed_at timestamptz,response_json jsonb default '{}'::jsonb,notes text);
create table if not exists public.thicc_client_referrals (id uuid primary key default gen_random_uuid(),client_id text not null references public.thicc_clients(id) on delete cascade,referral_name text not null,referral_date date,status text,notes text);
create table if not exists public.thicc_client_focus_events (id uuid primary key default gen_random_uuid(),client_id text not null references public.thicc_clients(id) on delete cascade,event_type text,event_label text,event_date date,notes text,active boolean default true);
create table if not exists public.thicc_client_payments (id uuid primary key default gen_random_uuid(),client_id text not null references public.thicc_clients(id) on delete cascade,payment_schedule text,payment_due_date date,amount numeric,status text,notes text,created_at timestamptz default now());
create table if not exists public.thicc_client_celebrations (id uuid primary key default gen_random_uuid(),client_id text not null references public.thicc_clients(id) on delete cascade,title text not null,description text,media_id text,sort_order integer default 0,created_at timestamptz default now());
create table if not exists public.thicc_client_checkins (id uuid primary key default gen_random_uuid(),client_id text not null references public.thicc_clients(id) on delete cascade,meals_per_week integer,myfitfoods_verified boolean default false,protein_target numeric,carb_target numeric,fat_target numeric,water_target numeric,calorie_target numeric,notes text,created_at timestamptz default now());
alter table public.thicc_clients add column if not exists active boolean default true;
alter table public.thicc_clients add column if not exists display_name text;
alter table public.thicc_clients add column if not exists updated_at timestamptz default now();

insert into public.clockit_option_sets(group_key,option_key,option_label,option_value,display_order,active)
values
('thicc_client_colors','cobalt','COBALT','#3b82f6',1,true),('thicc_client_colors','emerald','EMERALD','#10b981',2,true),('thicc_client_colors','amber','AMBER','#f59e0b',3,true),('thicc_client_colors','violet','VIOLET','#8b5cf6',4,true),('thicc_client_colors','teal','TEAL','#14b8a6',5,true),('thicc_client_colors','indigo','INDIGO','#6366f1',6,true),('thicc_client_colors','slate','SLATE','#64748b',7,true),('thicc_client_colors','orange','ORANGE','#f97316',8,true),('thicc_client_colors','cyan','CYAN','#06b6d4',9,true),('thicc_client_colors','lime','LIME','#84cc16',10,true),('thicc_client_colors','sky','SKY','#0ea5e9',11,true),('thicc_client_colors','navy','NAVY','#1e3a8a',12,true),('thicc_client_colors','plum','PLUM','#7e22ce',13,true),('thicc_client_colors','gold','GOLD','#ca8a04',14,true),('thicc_client_colors','olive','OLIVE','#65a30d',15,true),('thicc_client_colors','mint','MINT','#34d399',16,true),('thicc_client_colors','aqua','AQUA','#22d3ee',17,true),('thicc_client_colors','steel','STEEL','#475569',18,true),('thicc_client_colors','chocolate','CHOCOLATE','#92400e',19,true),('thicc_client_colors','sand','SAND','#d97706',20,true),('thicc_client_colors','forest','FOREST','#166534',21,true),('thicc_client_colors','sea','SEA','#0f766e',22,true),('thicc_client_colors','ice','ICE','#0891b2',23,true),('thicc_client_colors','storm','STORM','#334155',24,true),('thicc_client_colors','royal','ROYAL','#4338ca',25,true),('thicc_client_colors','orchid','ORCHID','#9333ea',26,true),('thicc_client_colors','ruby2','RUBY','#b91c1c',27,true),('thicc_client_colors','brick','BRICK','#c2410c',28,true),('thicc_client_colors','sage','SAGE','#4d7c0f',29,true),('thicc_client_colors','ocean','OCEAN','#0369a1',30,true)
on conflict do nothing;
