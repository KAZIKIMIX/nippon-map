-- Manual recovery only. Check subsequent edits before running.
BEGIN;
UPDATE public.places SET prefecture_name='兵庫県・大阪府', metadata=metadata - ARRAY['prefecture_assignment'] WHERE id=15 AND prefecture_name='大阪府' RETURNING id,prefecture_name;
UPDATE public.places SET name='津島やすらぎの里', metadata=metadata - ARRAY['previous_name','name_verification_source','name_checked_on'] WHERE id=2285 AND name='津島熱田温泉' RETURNING id,name;
UPDATE public.places SET municipality_name='木曽町', metadata=metadata - ARRAY['municipality_name_previous','municipality_name_checked_on','municipality_name_source'] WHERE id=1839 AND municipality_name='木曽郡木曽町' RETURNING id,municipality_name;
UPDATE public.places SET municipality_name='大桑村', metadata=metadata - ARRAY['municipality_name_previous','municipality_name_checked_on','municipality_name_source'] WHERE id=1840 AND municipality_name='木曽郡大桑村' RETURNING id,municipality_name;
UPDATE public.places SET municipality_name='平谷村', metadata=metadata - ARRAY['municipality_name_previous','municipality_name_checked_on','municipality_name_source'] WHERE id=1842 AND municipality_name='下伊那郡平谷村' RETURNING id,municipality_name;
UPDATE public.places SET municipality_name='下條村', metadata=metadata - ARRAY['municipality_name_previous','municipality_name_checked_on','municipality_name_source'] WHERE id=1843 AND municipality_name='下伊那郡下條村' RETURNING id,municipality_name;
-- Inspect all returned rows before deciding to COMMIT; default is no change.
ROLLBACK;

