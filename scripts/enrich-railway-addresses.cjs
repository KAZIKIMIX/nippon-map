#!/usr/bin/env node
/**
 * Railway address enrichment, review-first.
 * Usage:
 *   SUPABASE_URL=... SUPABASE_SERVICE_ROLE_KEY=... node scripts/enrich-railway-addresses.cjs
 *   ... node scripts/enrich-railway-addresses.cjs --apply --limit=100
 * Default: dry-run, writes proposals to railway-address-proposals.json.
 * Requires Node 20+ (native fetch). Reverse geocoding: OpenStreetMap Nominatim.
 * Respect public Nominatim usage policy: <=1 request/sec, valid identifying User-Agent;
 * for 8,955 records use a dedicated/bulk-approved geocoder instead.
 */
const fs = require('node:fs');
const args = process.argv.slice(2);
const apply = args.includes('--apply');
const limit = Number(args.find(x => x.startsWith('--limit='))?.split('=')[1] || 20);
const endpoint = process.env.GEOCODER_URL || 'https://nominatim.openstreetmap.org/reverse';
const ua = process.env.GEOCODER_USER_AGENT;
const base = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
if (!base || !key || !ua) throw Error('SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY and GEOCODER_USER_AGENT are required');
if (!Number.isInteger(limit) || limit < 1 || limit > 10000) throw Error('Invalid --limit');
if (apply && !args.includes('--reviewed')) throw Error('--apply requires --reviewed and a manually reviewed proposal file');
const headers = {apikey:key,Authorization:`Bearer ${key}`};
const validAddress = x => {
  if (!x || x.approved !== true || x.prefecture_matches !== true ||
      x.station_matches !== true || x.source_verified !== true ||
      typeof x.source_url !== 'string' || !/^https:\/\//.test(x.source_url) ||
      typeof x.proposed_address !== 'string' ||
      typeof x.original_address !== 'string' ||
      x.proposed_address === x.original_address ||
      !x.proposed_address.startsWith(x.original_address) ||
      x.proposed_address.length < x.original_address.length + 3) return false;
  return true;
};
const sleep = ms => new Promise(r=>setTimeout(r,ms));
async function request(url, options={}) {
  const r=await fetch(url,{...options,headers:{...headers,...options.headers}});
  if (!r.ok) throw Error(`HTTP ${r.status}: ${(await r.text()).slice(0,300)}`);
  return r.json();
}
async function main(){
  const output='railway-address-proposals.json';
  if(apply){
    const proposals=JSON.parse(fs.readFileSync(output,'utf8')).filter(validAddress);
    let updated=0;
    for(const x of proposals.slice(0,limit)){
      const params=new URLSearchParams({id:`eq.${x.id}`,address:`eq.${x.original_address}`,category_id:`eq.${x.category_id}`,name:`eq.${x.name}`,prefecture_name:`eq.${x.original_address}`,is_active:'eq.true',select:'id'});
      const rows=await request(`${base}/rest/v1/places?${params}`,{method:'PATCH',headers:{'Content-Type':'application/json',Prefer:'return=representation'},body:JSON.stringify({address:x.proposed_address})});
      updated+=rows.length;
    }
    console.log(JSON.stringify({approved:proposals.length,updated}));
    return;
  }
  const categories=await request(`${base}/rest/v1/categories?slug=eq.railway&select=id`);
  if(categories.length!==1) throw Error('Railway category not found');
  const categoryId=categories[0].id;
  const proposals=[];
  let offset=0;
  while(proposals.length<limit){
    const batch=await request(`${base}/rest/v1/places?category_id=eq.${categoryId}&is_active=eq.true&select=id,name,address,prefecture_name,latitude,longitude,category_id&order=id.asc&limit=1000&offset=${offset}`);
    if(!batch.length) break;
    for(const p of batch){
      if(proposals.length>=limit) break;
      if(p.address!==p.prefecture_name || p.latitude==null || p.longitude==null) continue;
      const url=new URL(endpoint);
      url.searchParams.set('lat',p.latitude);
      url.searchParams.set('lon',p.longitude);
      url.searchParams.set('format','jsonv2');
      url.searchParams.set('addressdetails','1');
      const response=await fetch(url,{headers:{'User-Agent':ua,'Accept-Language':'ja'}});
      if(!response.ok) throw Error(`Geocoder HTTP ${response.status}`);
      const geo=await response.json();
      const address=geo.address||{};
      const prefecture=address.state||address.province||'';
      const city=address.city||address.town||address.village||address.municipality||address.county||'';
      const district=address.suburb||address.quarter||address.neighbourhood||'';
      const road=address.road||'';
      const number=address.house_number||'';
      const proposed=[prefecture,city,district,road,number].filter(Boolean).join('');
      proposals.push({id:p.id,category_id:categoryId,name:p.name,original_address:p.address,proposed_address:proposed,geocoder_display_name:geo.display_name||'',prefecture_matches:prefecture===p.prefecture_name,station_matches:false,source_verified:false,source_url:'',approved:false});
      await sleep(1100);
    }
    offset+=batch.length;
  }
  fs.writeFileSync(output,JSON.stringify(proposals,null,2));
  console.log(JSON.stringify({proposals:proposals.length,output,applied:0}));
}
main().catch(e=>{console.error(e);process.exitCode=1});
