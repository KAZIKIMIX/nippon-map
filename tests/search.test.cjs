const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const {NextRequest}=require('next/server');
function compile(path,customRequire=require){
 const output=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{}};new Function('exports','module','require',output)(module.exports,module,customRequire);return module.exports;
}
let data=[],error=null,filters=[],calls=0;
const chain={select(){return this},eq(){return this},in(){return this},or(value){filters.push(value);return this},order(){return this},limit(){return this},async abortSignal(){return {data,error}}};
const route=compile('app/api/search/route.ts',name=>name==='../../../lib/map-categories'?{mapCategories:[{slug:'zoo'},{slug:'railway'}]}:name==='@supabase/supabase-js'?{createClient:()=>{calls++;return {from:()=>chain}}}:require(name));
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public-key';
const request=q=>new NextRequest('https://nippon-map.vercel.app/api/search?q='+encodeURIComponent(q));
(async()=>{
 for(const q of ['', 'x'.repeat(81),'%,()_"\\'])assert.deepEqual(await (await route.GET(request(q))).json(),{places:[]});
 assert.equal(filters.length,0);
 data=[{id:1,name:'東京駅',categories:{slug:'railway',name:'鉄道駅'}},{id:2,name:'町田リス園',categories:[{slug:'zoo',name:'動物園'}]}];
 let response=await route.GET(request('東京駅')),body=await response.json();
 assert.equal(response.status,200);assert.deepEqual(body.places.map(p=>p.category_slug),['railway','zoo']);assert.equal(body.has_more,false);
 await route.GET(request('ＴＯＫＹＯ'));assert.ok(filters.at(-1).includes('TOKYO'));
 await route.GET(request('東京%,(駅)'));assert.ok(filters.at(-1).includes('%東京駅%'));assert.equal(filters.at(-1).split(',').length,4);
 data=Array.from({length:101},(_,id)=>({id,name:'東京',categories:{slug:'railway',name:'鉄道駅'}}));
 body=await (await route.GET(request('東京'))).json();assert.equal(body.places.length,100);assert.equal(body.has_more,true);assert.equal(body.limit,100);
 error={message:'private database details'};response=await route.GET(request('東京'));assert.equal(response.status,503);assert.ok(!JSON.stringify(await response.json()).includes('private'));
 console.log('Search tests passed: bounded input, normalization, escaped filters, category flattening, result limit and controlled errors.');
})().catch(error=>{console.error(error);process.exit(1)});
