# Supabase public schema RLS and grant review — 2026-10-12

Live project: zkehvxstlogqzidwksnb. Reviewed security advisors, pg_tables, pg_policies, and information_schema.role_table_grants.

## Findings
- All 6 public tables have RLS enabled: categories, map_usage_events, place_exclusions, place_submissions, places, sources.
- Explicit anon/authenticated grants: categories SELECT, places SELECT, sources SELECT, place_submissions INSERT. No explicit public UPDATE or DELETE grants found.
- place_submissions has an INSERT policy but no SELECT policy; submissions should not be publicly readable.
- place_exclusions has RLS enabled and no policies; Supabase security advisor emits one INFO lint for this, consistent with a private table.
- map_usage_events has an anon INSERT policy but no explicit anon INSERT table grant in the inspected grants. If analytics writes are expected from the browser, verify the write path; do not grant access without checking abuse controls.
- Security advisor returned no WARN/ERROR lints, one INFO.

## Scope and caveats
This review does not constitute penetration testing or prove that every RPC function, API endpoint, secret, or external dependency is secure. Inspect SECURITY DEFINER functions, schema grants, and spam/rate limits separately before treating the whole service as security certified. No RLS policies or grants were changed.
