-- Access control. Split from the schema migration so the table shapes and the
-- policy decisions can be reviewed independently.

alter table remedy_entries enable row level security;
alter table symptom_history enable row level security;

grant usage on schema public to anon, authenticated, service_role;

-- remedy_entries is a curated public library, not personal data: readable by
-- anyone, writable only by the loader running under the service role.
grant select on remedy_entries to anon, authenticated;
grant all privileges on remedy_entries to service_role;

create policy "remedy_entries are publicly readable"
  on remedy_entries for select
  to anon, authenticated
  using (true);

-- symptom_history is personal health data. No anon or authenticated grant and no
-- policy: it stays server-side under the service role until real auth exists.
-- Adding a per-user policy is F13 in the backlog, not a demo-day change.
grant all privileges on symptom_history to service_role;

grant execute on function match_remedies(vector, text[], int)
  to anon, authenticated, service_role;
