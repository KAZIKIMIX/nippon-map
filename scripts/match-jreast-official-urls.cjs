#!/usr/bin/env node
/**
 * JR East official URL candidate matcher. Node >=18, no external dependencies.
 * Input: stations.json array of {id,name,prefecture_name,routes,operators,official_url}
 * Input: official.json array of {name,prefecture_name,routes,url,source_url,evidence}
 * Output: verified.json and review.json. Never writes to Supabase automatically.
 * The official.json feed must be independently collected from JR East's actual pages.
 */
const fs = require('node:fs');
const { URL } = require('node:url');
const [stationsPath, officialPath, outputPrefix = 'jreast-match'] = process.argv.slice(2);
if (!stationsPath || !officialPath) {
  console.error('Usage: node scripts/match-jreast-official-urls.cjs stations.json official.json [output-prefix]');
  process.exit(2);
}
const stations = JSON.parse(fs.readFileSync(stationsPath, 'utf8'));
const official = JSON.parse(fs.readFileSync(officialPath, 'utf8'));
if (!Array.isArray(stations) || !Array.isArray(official)) throw Error('Expected arrays');
const norm = x => String(x || '').normalize('NFKC').replace(/\s+/g,'').replace(/駅$/,'').toLowerCase();
const canonical = u => { try {
  const p = new URL(u);
  if (p.protocol !== 'https:' || !['www.jreast.co.jp','timetables.jreast.co.jp'].includes(p.hostname)) return null;
  if (p.pathname === '/' || p.pathname === '/estation/' || p.pathname === '/estation/station/') return null;
  return p.href;
} catch { return null; } };
const routes = x => (Array.isArray(x) ? x : []).map(norm).filter(Boolean);
const verified=[],review=[];
for (const s of stations) {
  if (!Number.isInteger(s.id) || !s.name || !s.prefecture_name) {review.push({station:s,reason:'invalid_station'});continue;}
  if (s.official_url && String(s.official_url).trim()) {review.push({id:s.id,reason:'already_has_url'});continue;}
  const matches=official.filter(o => norm(o.name)===norm(s.name) &&
    norm(o.prefecture_name)===norm(s.prefecture_name) &&
    canonical(o.url) &&
    o.source_url && canonical(o.source_url) &&
    typeof o.evidence==='string' && o.evidence.trim().length>=12 &&
    routes(s.routes).length && routes(o.routes).some(r=>routes(s.routes).includes(r)));
  const urls=[...new Set(matches.map(m=>canonical(m.url)))];
  if (urls.length===1) verified.push({
    id:s.id,name:s.name,prefecture_name:s.prefecture_name,
    official_url:urls[0],source_url:matches[0].source_url,
    evidence:matches[0].evidence,verified_on:new Date().toISOString().slice(0,10)
  });
  else review.push({id:s.id,name:s.name,prefecture_name:s.prefecture_name,reason:urls.length?'ambiguous_urls':'not_matched',candidates:urls});
}
fs.writeFileSync(outputPrefix+'.verified.json',JSON.stringify(verified,null,2)+'\n');
fs.writeFileSync(outputPrefix+'.review.json',JSON.stringify(review,null,2)+'\n');
console.log(JSON.stringify({stations:stations.length,official:official.length,verified:verified.length,review:review.length}));
