#!/usr/bin/env node
/**
 * Build a guarded, batch SQL update from independently verified JR East URL matches.
 * Usage: node scripts/build-jreast-url-update.cjs verified.json update.sql
 * Never executes SQL. Review the output before running in Supabase.
 */
const fs=require('node:fs');
const [input,output]=process.argv.slice(2);
if(!input||!output)throw Error('Usage: node scripts/build-jreast-url-update.cjs verified.json update.sql');
const rows=JSON.parse(fs.readFileSync(input,'utf8'));
if(!Array.isArray(rows))throw Error('Expected array');
const esc=x=>"'"+String(x).replace(/'/g,"''")+"'";
const ids=new Set();
const values=[];
for(const r of rows){
 if(!Number.isSafeInteger(r.id)||r.id<=0||ids.has(r.id))throw Error('Invalid or duplicate ID: '+r.id);
 ids.add(r.id);
 for(const k of ['name','prefecture_name','official_url','source_url','evidence'])if(typeof r[k]!=='string'||!r[k].trim())throw Error('Missing '+k+' for '+r.id);
 const u=new URL(r.official_url),src=new URL(r.source_url);
 if(u.protocol!=='https:'||src.protocol!=='https:'||!['www.jreast.co.jp','timetables.jreast.co.jp'].includes(u.hostname)||!['www.jreast.co.jp','timetables.jreast.co.jp'].includes(src.hostname))throw Error('Non-official URL: '+r.id);
 if(['/', '/estation/'].includes(u.pathname))throw Error('Generic URL: '+r.id);
 values.push('('+[r.id,r.name,r.prefecture_name,r.official_url,r.source_url,r.evidence].map((v,i)=>i===0?String(v):esc(v)).join(',')+')');
}
const sql=values.length? `WITH verified(id,name,prefecture_name,url,source_url,evidence) AS (
 VALUES ${values.join(',\n')}
), updated AS (
 UPDATE public.places p
 SET official_url=v.url,
 metadata=jsonb_set(COALESCE(p.metadata,'{}'::jsonb),'{official_url_research}',jsonb_build_object('status','verified_official_page','source_url',v.source_url,'evidence',v.evidence,'updated_at',CURRENT_DATE::text),true)
 FROM verified v,public.categories c
 WHERE p.id=v.id AND p.category_id=c.id AND c.slug='railway'
 AND p.is_active AND p.metadata->'operators' ? '東日本旅客鉄道'
 AND p.name=v.name AND p.prefecture_name=v.prefecture_name
 AND NULLIF(btrim(p.official_url),'') IS NULL
 RETURNING p.id,p.name,p.official_url
)
SELECT * FROM updated ORDER BY id;
`:'-- No verified records; no update generated.\n';
fs.writeFileSync(output,sql);
console.log(JSON.stringify({verified:rows.length,sql:output}));
