-- TEMP DEV RLS UNBLOCK FOR ITS.GETTING.THICC
-- NOTE: Temporary anon/authenticated policies for browser app wiring.
-- TODO: Replace with auth.uid() owner-scoped policies before production launch.

-- Keep RLS enabled on all ITS tables used by browser flows.
alter table if exists public.thicc_clients enable row level security;
alter table if exists public.thicc_client_logs enable row level security;
alter table if exists public.media_library enable row level security;
alter table if exists public.thicc_client_profiles enable row level security;
alter table if exists public.thicc_client_program_splits enable row level security;
alter table if exists public.thicc_client_schedule_entries enable row level security;
alter table if exists public.thicc_client_forms enable row level security;
alter table if exists public.thicc_client_form_assignments enable row level security;
alter table if exists public.thicc_client_referrals enable row level security;
alter table if exists public.thicc_client_focus_events enable row level security;
alter table if exists public.thicc_client_payments enable row level security;
alter table if exists public.thicc_client_celebrations enable row level security;
alter table if exists public.thicc_client_checkins enable row level security;
alter table if exists public.clockit_option_sets enable row level security;

-- Drop/recreate so migration is idempotent across reset/replay.
drop policy if exists tmp_dev_thicc_clients_all on public.thicc_clients;
create policy tmp_dev_thicc_clients_all on public.thicc_clients
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_logs_all on public.thicc_client_logs;
create policy tmp_dev_thicc_client_logs_all on public.thicc_client_logs
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_media_library_all on public.media_library;
create policy tmp_dev_media_library_all on public.media_library
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_profiles_all on public.thicc_client_profiles;
create policy tmp_dev_thicc_client_profiles_all on public.thicc_client_profiles
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_program_splits_all on public.thicc_client_program_splits;
create policy tmp_dev_thicc_client_program_splits_all on public.thicc_client_program_splits
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_schedule_entries_all on public.thicc_client_schedule_entries;
create policy tmp_dev_thicc_client_schedule_entries_all on public.thicc_client_schedule_entries
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_forms_all on public.thicc_client_forms;
create policy tmp_dev_thicc_client_forms_all on public.thicc_client_forms
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_form_assignments_all on public.thicc_client_form_assignments;
create policy tmp_dev_thicc_client_form_assignments_all on public.thicc_client_form_assignments
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_referrals_all on public.thicc_client_referrals;
create policy tmp_dev_thicc_client_referrals_all on public.thicc_client_referrals
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_focus_events_all on public.thicc_client_focus_events;
create policy tmp_dev_thicc_client_focus_events_all on public.thicc_client_focus_events
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_payments_all on public.thicc_client_payments;
create policy tmp_dev_thicc_client_payments_all on public.thicc_client_payments
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_celebrations_all on public.thicc_client_celebrations;
create policy tmp_dev_thicc_client_celebrations_all on public.thicc_client_celebrations
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_thicc_client_checkins_all on public.thicc_client_checkins;
create policy tmp_dev_thicc_client_checkins_all on public.thicc_client_checkins
for all to anon, authenticated
using (true)
with check (true);

drop policy if exists tmp_dev_clockit_option_sets_all on public.clockit_option_sets;
create policy tmp_dev_clockit_option_sets_all on public.clockit_option_sets
for all to anon, authenticated
using (true)
with check (true);
