#!/usr/bin/env node
/** Conservative JR East official URL verifier. No guessed URLs or generic search pages. */
'use strict';
const fs=require('node:fs');
const {URL}=require('node:url');
const [stationFile,candidateFile,prefix='jreast-batch-results/jreast']=process.argv.slice(2);
if(!stationFile||!candidateFile)throw Error('Usage: node scripts/verify-jreast-urls.cjs stations.json candidates.json output-prefix');
const stations=JSON.parse(fs.readFileSync(stationFile,'utf8'));
const candidates=JSON.parse(fs.readFileSync(candidateFile,'utf8'));
const normalize=x=>String(x??'').normalize('NFKC').replace(/[\s　]+/g,'').replace(/ヶ/g,'ケ').replace(/ヵ/g,'カ').replace(/駅$/,'').toLowerCase();
const routeSet=x=>(Array.isArray(x)?x:[]).map(normalize).filter(Boolean);
const allowed=['www.jreast.co.jp','timetables.jreast.co.jp'];
const generic=new Set(['/','/estation','/estation/','/estation/station','/estation/station/']);
function classify(raw){
 try {
  const u=new URL(raw);
  if(u.protocol!=='https:'||!allowed.includes(u.hostname)||generic.has(u.pathname)||u.username||u.password)return null;
  if(u.searchParams.has('StationCd')&&u.pathname==='/estation/station/info.aspx')return 'verified_individual';
  if(u.hostname==='timetables.jreast.co.jp'&&/\/(?:timetable|station|tt)\b|\/cgi-bin\/tt\.cgi/i.test(u.pathname))return 'verified_timetable';
  if(u.pathname.toLowerCase().endsWith('.pdf'))return 'verified_pdf';
  if(/\/route\/|\/rosen\/|\/line\/|\/map\//i.test(u.pathname))return 'verified_route_list';
  return null;
 }catch{return null;}
}
const rank={verified_individual:0,verified_timetable:1,verified_route_list:2,verified_pdf:3};
function evidenceOK(c,s){
 const u=classify(c.url);
 if(!u||c.http_status!==200||c.content_verified!==true||c.station_name_verified!==true||c.operator_verified!==true)return null;
 if(normalize(c.name)!==normalize(s.name)||normalize(c.prefecture_name)!==normalize(s.prefecture_name))return null;
 if(!routeSet(s.routes).length||!routeSet(c.routes).some(x=>routeSet(s.routes).includes(x)))return null;
 if(typeof c.evidence!=='string'||c.evidence.trim().length<12)return null;
 if(typeof c.source_url!=='string'||!classify(c.source_url))return null;
 if(u==='verified_pdf'&&!c.pdf_station_text_verified)return null;
 if(u==='verified_route_list'&&!c.list_station_text_verified)return null;
 return u;
}
const verified=[],review=[];
for(const s of stations){
 if(s.official_url){review.push({id:s.id,reason:'already_registered'});continue;}
 const valid=candidates.filter(c=>normalize(c.name)===normalize(s.name)&&normalize(c.prefecture_name)===normalize(s.prefecture_name)).map(c=>({...c,status:evidenceOK(c,s)})).filter(c=>c.status);
 valid.sort((a,b)=>rank[a.status]-rank[b.status]);
 const best=valid[0];
 if(!best){review.push({id:s.id,name:s.name,reason:'no_verified_url'});continue;}
 const tied=valid.filter(x=>rank[x.status]===rank[best.status]);
 if(new Set(tied.map(x=>x.url)).size!==1){review.push({id:s.id,name:s.name,reason:'ambiguous_urls',candidates:tied.map(x=>x.url)});continue;}
 verified.push({id:s.id,name:s.name,prefecture_name:s.prefecture_name,official_url:best.url,source_url:best.source_url,evidence:best.evidence,url_status:best.status,verified_on:new Date().toISOString().slice(0,10)});
}
fs.mkdirSync(require('node:path').dirname(prefix),{recursive:true});
fs.writeFileSync(prefix+'.verified.json',JSON.stringify(verified,null,2)+'\n');
fs.writeFileSync(prefix+'.review.json',JSON.stringify(review,null,2)+'\n');
console.log(JSON.stringify({stations:stations.length,candidates:candidates.length,verified:verified.length,review:review.length,by_type:Object.fromEntries(Object.keys(rank).map(k=>[k,verified.filter(v=>v.url_status===k).length]))}));
