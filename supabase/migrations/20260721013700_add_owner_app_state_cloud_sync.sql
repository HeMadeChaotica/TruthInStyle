create table if not exists public.owner_app_state (
  owner_key text primary key,
  state jsonb not null default '{}'::jsonb,
  updated_at timestamptz not null default now()
);

alter table public.owner_app_state enable row level security;

comment on table public.owner_app_state is
  'Owner-only TruthInStyle browser working state, accessed exclusively through authenticated server routes.';
