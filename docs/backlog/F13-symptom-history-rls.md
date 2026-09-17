# F13 — Per-user RLS on symptom_history

**Status:** Todo · **Owner:** dev lead · **Blocked on:** an auth decision

## What

`symptom_history` is personal health data. Right now it has row level security
enabled with **no policy and no grant** to `anon` or `authenticated`, so it is
reachable only server-side under the service role. That is correct for a
single-persona demo and wrong for real users.

`supabase/migrations/20260917130000_rls_and_grants.sql`

## Why it is not done today

Adding a per-user policy requires deciding how a user is identified — Supabase Auth,
an external identity, or anonymous device-scoped IDs. That is a product decision, not
a demo-day change, and guessing it now would bake in the wrong model.

## Acceptance criteria

- [ ] Users are identified by a decided mechanism
- [ ] `symptom_history` rows are scoped to their owner
- [ ] `select`, `insert` and `update` policies restrict to the owning user
- [ ] No path allows reading another user's history, verified by a test
- [ ] `persona_id` either maps to a real user ID or is replaced by one
- [ ] The service role retains access for server-side pipeline reads

## Risk if shipped without this

Any leak of the anon key would expose every user's symptom history. The current
no-grant state is safe; the risk arrives the moment someone adds a convenience
policy without scoping it.
