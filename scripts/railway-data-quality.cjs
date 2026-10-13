// Run against the existing Supabase public.places table in SQL Editor.
// This script is read-only and identifies data-quality work remaining.
// It intentionally does not infer station addresses or municipality codes.
const fs=require('node:fs');
const sql=`SELECT
  category_id,
  COUNT(*) AS active_places,
  COUNT(*) FILTER (WHERE municipality_code IS NULL OR btrim(municipality_code)='') AS missing_municipality_code,
  COUNT(*) FILTER (WHERE municipality_name IS NULL OR btrim(municipality_name)='') AS missing_municipality_name,
  COUNT(*) FILTER (WHERE address IS NULL OR length(btrim(address))<7) AS short_or_missing_address,
  COUNT(*) FILTER (WHERE latitude IS NULL OR longitude IS NULL) AS missing_coordinates,
  COUNT(*) FILTER (WHERE municipality_code IS NOT NULL AND LEFT(municipality_code,2)<>prefecture_code) AS prefecture_code_mismatches
FROM public.places
WHERE is_active
GROUP BY category_id
ORDER BY active_places DESC;

SELECT municipality_code,
  COUNT(DISTINCT municipality_name) AS distinct_names,
  string_agg(DISTINCT municipality_name,' / ' ORDER BY municipality_name) AS observed_names
FROM public.places
WHERE is_active AND municipality_code IS NOT NULL AND municipality_name IS NOT NULL AND btrim(municipality_name)<>''
GROUP BY municipality_code
HAVING COUNT(DISTINCT municipality_name)>1
ORDER BY municipality_code;
`;
if(process.argv.includes('--print'))process.stdout.write(sql);
else {const path='audits/railway-data-quality-queries.sql';fs.writeFileSync(path,sql);console.log('Wrote '+path)}
