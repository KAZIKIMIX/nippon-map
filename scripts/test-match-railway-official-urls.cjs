#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'railway-match-'));
try {
 const places=[{id:1,name:'鞍馬駅',prefecture_name:'京都府',municipality_name:'京都市左京区',official_url:null,metadata:{operators:['叡山電鉄']}},{id:2,name:'県庁前駅',prefecture_name:'愛媛県',municipality_name:'松山市',official_url:null,metadata:{operators:['伊予鉄道']}},{id:3,name:'鞍馬駅',prefecture_name:'京都府',municipality_name:'京都市左京区',official_url:'https://existing.example.jp'}];
 const official=[{name:'鞍馬駅',prefecture_name:'京都府',municipality_name:'京都市左京区',operator:'叡山電鉄',official_url:'https://eizandensha.co.jp/guide/station/kurama.html',verified_source:'operator_official'},{name:'県庁前駅',prefecture_name:'沖縄県',municipality_name:'那覇市',operator:'ゆいレール',official_url:'https://www.yui-rail.co.jp/routemap/kenchomae/',verified_source:'operator_official'}];
 const a=path.join(dir,'places.json'),b=path.join(dir,'official.json');
 fs.writeFileSync(a,JSON.stringify(places));fs.writeFileSync(b,JSON.stringify(official));
 const run=spawnSync(process.execPath,[path.join(__dirname,'match-railway-official-urls.cjs'),a,b],{encoding:'utf8'});
 assert.equal(run.status,0,run.stderr);
 const result=JSON.parse(run.stdout);
 assert.equal(result.summary.processed,2);
 assert.equal(result.summary.candidate_review,1);
 assert.equal(result.summary.not_found,1);
 assert.equal(result.results.find(x=>x.id===2).candidate_url,null);
 console.log('PASS railway URL matching fixture');
} finally {fs.rmSync(dir,{recursive:true,force:true});}
