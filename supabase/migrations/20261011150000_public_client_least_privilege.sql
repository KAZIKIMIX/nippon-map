-- Public clients only read published facility data and submit pending reports.
REVOKE INSERT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.categories, public.places, public.sources FROM anon, authenticated;
REVOKE SELECT, UPDATE, DELETE, TRUNCATE, REFERENCES, TRIGGER ON TABLE public.place_submissions FROM anon, authenticated;
