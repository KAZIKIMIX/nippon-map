const fs=require('node:fs');
const ts=require('typescript');
const assert=require('node:assert/strict');
const {NextRequest}=require('next/server');

function compile(path,customRequire=require){
 const output=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const mod={exports:{}};
 new Function('exports','module','require',output)(mod.exports,mod,customRequire);
 return mod.exports;
}
let rows=[],error=null,filters=[],ranges=[],calls=0;
const chain={
 select(){return this},eq(){return this},in(){return this},
 or(value){filters.push(value);return this},order(){return this},
 range(from,to){ranges.push([from,to]);return this},
 async abortSignal(){return {data:rows.slice(ranges.at(-1)[0],ranges.at(-1)[1]+1),error}}
};
const route=compile('app/api/search/route.ts',name=>
 name==='../../../lib/map-categories'?{mapCategories:[{slug:'zoo'},{slug:'railway'}]}:
 name==='@supabase/supabase-js'?{createClient:()=>{calls++;return {from:()=>chain}}}:require(name)
);
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public-key';
const request=q=>new NextRequest('https://nippon-map.vercel.app/api/search?q='+encodeURIComponent(q));
const record=(id,name,slug='railway')=>({id,name,name_kana:null,prefecture_name:'東京都',municipality_name:'千代田区',address:'東京都千代田区',latitude:35.68,longitude:139.76,official_url:null,data_date:null,categories:{slug,name:slug==='railway'?'鉄道駅':'動物園'}});

(async()=>{
 let response=await route.GET(request(''));
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).places,[]);
 response=await route.GET(request('x'.repeat(81)));
 assert.equal(response.status,400);
 response=await route.GET(request('%,()_"\\'));
 assert.equal(response.status,200);
 assert.deepEqual((await response.json()).places,[]);
 assert.equal(calls,0,'invalid queries must not touch database');

 rows=[record(1,'東京駅'),record(2,'東京動物園','zoo'),record(3,'大阪駅')];
 let body=await (await route.GET(request('東京'))).json();
 assert.deepEqual(body.places.map(p=>p.id),[1,2]);
 assert.deepEqual(body.places.map(p=>p.category_slug),['railway','zoo']);
 assert.equal(body.has_more,false);
 assert.deepEqual(ranges.at(-1),[0,499]);

 await route.GET(request('ＴＯＫＹＯ'));
 assert.ok(filters.at(-1).includes('TOKYO'));
 await route.GET(request('東京%,(駅)'));
 assert.ok(filters.at(-1).includes('%東京駅%'));

 rows=Array.from({length:501},(_,id)=>record(id+1,'東京駅'));
 ranges=[];
 body=await (await route.GET(request('東京'))).json();
 assert.deepEqual(ranges,[[0,499],[500,999]],'search must paginate instead of silently truncating at 500');
 assert.equal(body.places.length,100);
 assert.equal(body.has_more,true);
 assert.equal(body.limit,100);

 rows=[record(1,'東京駅')];
 error={message:'private database details'};
 response=await route.GET(request('東京'));
 assert.equal(response.status,503);
 assert.ok(!JSON.stringify(await response.json()).includes('private'));
 console.log('Search API regression checks passed');
})().catch(e=>{console.error(e);process.exitCode=1});
