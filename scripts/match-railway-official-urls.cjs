#!/usr/bin/env node
'use strict';
// Match exported railway rows to a verified operator station catalogue.
// Usage: node scripts/match-railway-official-urls.cjs places.json official-stations.json > matches.json
// No DB writes. Never infer station URLs from operator homepages.
const fs = require('node:fs');
const norm = s => String(s ?? '').normalize('NFKC').replace(/[\s　]/g,'').replace(/[ヶケ]/g,'ケ').trim();
const read = path => { const data=JSON.parse(fs.readFileSync(path,'utf8')); if(!Array.isArray(data)) throw Error(path+' must contain an array'); return data; };
if (process.argv.length!==4) { console.error('Usage: node scripts/match-railway-official-urls.cjs places.json official-stations.json'); process.exit(2); }
const places=read(process.argv[2]), official=read(process.argv[3]);
const validUrl=u=>{ try { const x=new URL(u); return x.protocol==='https:' && !x.username && !x.password && !['localhost','127.0.0.1'].includes(x.hostname) && x.hostname.includes('.'); } catch { return false; } };
const catalogue=new Map();
for(const s of official) {
 if(!s.operator || !s.name || !s.prefecture_name || !s.municipality_name || !validUrl(s.official_url) || s.verified_source!=='operator_official') continue;
 const key=[norm(s.name),norm(s.prefecture_name),norm(s.municipality_name)].join('|');
 const list=catalogue.get(key)||[];list.push(s);catalogue.set(key,list);
}
const results=[], seen=new Set();
for(const p of places) {
 if(!Number.isSafeInteger(p.id)||seen.has(p.id)||p.official_url) continue;
 seen.add(p.id);
 const key=[norm(p.name),norm(p.prefecture_name),norm(p.municipality_name)].join('|');
 const candidates=catalogue.get(key)||[];
 // Only a unique official URL is safe; operator/line conflicts require manual review.
 const placeOperators=Array.isArray(p.metadata?.operators)?p.metadata.operators.map(norm):Array.isArray(p.operators)?p.operators.map(norm):[];
 const compatible=candidates.filter(s=>placeOperators.includes(norm(s.operator)));
 const operators=[...new Set(compatible.map(s=>norm(s.operator)))];
 const urls=[...new Set(compatible.map(s=>s.official_url))];
 const status=urls.length===1 && operators.length===1 ? 'candidate_review' : compatible.length ? 'ambiguous' : candidates.length ? 'operator_mismatch' : 'not_found';
 results.push({id:p.id,name:p.name,prefecture_name:p.prefecture_name,municipality_name:p.municipality_name,status,candidate_url:status==='candidate_review'?urls[0]:null,operator:status==='candidate_review'?compatible[0].operator:null,candidate_count:compatible.length});
}
console.log(JSON.stringify({summary:{processed:results.length,candidate_review:results.filter(x=>x.status==='candidate_review').length,ambiguous:results.filter(x=>x.status==='ambiguous').length,not_found:results.filter(x=>x.status==='not_found').length},results},null,2));
