-- Read-only: review official URL formats before automated verification.
SELECT id,name,prefecture_name,official_url
FROM public.places WHERE is_active AND category_id=8
 AND official_url IS NOT NULL AND btrim(official_url)<>''
 AND official_url !~* '^https?://[^ /]+'
ORDER BY id;
