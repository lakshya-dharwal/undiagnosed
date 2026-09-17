-- Demo persona history for the golden path (docs/DEMO.md): pelvic pain at 5, 6, 7
-- across three cycles, then today's 8 with work missed.
-- Runs automatically on `supabase db reset`.
--
-- Remedy rows are NOT seeded here: they need embeddings, which come from
-- `npm run embed -- --file <spreadsheet>` (or `--fixtures` before real data lands).

insert into symptom_history (id, persona_id, symptom, severity, entry_date, functional_impact)
values
  ('22222222-2222-4222-8222-000000000001', 'persona_demo_01', 'pelvic_pain', 5, '2026-06-14T09:00:00Z', '{}'),
  ('22222222-2222-4222-8222-000000000002', 'persona_demo_01', 'pelvic_pain', 6, '2026-07-12T09:00:00Z', '{"cancelled_plans": true}'),
  ('22222222-2222-4222-8222-000000000003', 'persona_demo_01', 'pelvic_pain', 7, '2026-08-15T09:00:00Z', '{"cancelled_plans": true}')
on conflict (id) do nothing;
