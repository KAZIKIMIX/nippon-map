-- Optional audit table for reversible, reviewed data updates.
-- Do not execute without a deployment/migration review.
CREATE TABLE IF NOT EXISTS public.railway_municipality_change_audit (
 id bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
 place_id bigint NOT NULL,
 batch_id text NOT NULL,
 old_municipality_code text,
 old_municipality_name text,
 new_municipality_code text,
 new_municipality_name text,
 source_year integer NOT NULL,
 source_url text NOT NULL,
 changed_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.railway_municipality_change_audit ENABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.railway_municipality_change_audit FROM anon,authenticated;
CREATE INDEX IF NOT EXISTS railway_municipality_change_audit_batch_idx
 ON public.railway_municipality_change_audit(batch_id);
