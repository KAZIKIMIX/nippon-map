const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const {NextRequest}=require('next/server');
function compile(path,customRequire=require){const output=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const module={exports:{}};new Function('exports','module','require',output)(module.exports,module,customRequire);return module.exports;}
let data=[],error=null,filters=[],ranges=[],from=0,to=499;
const chain={select(){return this},eq(){return this},in(){return this},or(value){filters.push(value);return this},order(){return this},range(a,b){from=a;to=b;ranges.push([a,b]);return this},async abortSignal(){return {data:data.slice(from,to+1),error}}};
const route=compile('app/api/search/route.ts',name=>name==='../../../lib/search-results'?compile('lib/search-results.ts'):name==='../../../lib/map-categories'?{mapCategories:[{slug:'zoo'},{slug:'railway'}]}:name==='@supabase/supabase-js'?{createClient:()=>({from:()=>chain})}:require(name));
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public-key';
const request=q=>new NextRequest('https://nippon-map.vercel.app/api/search?q='+encodeURIComponent(q));
(async()=>{
 for(const q of ['', '%,()_"\\']){const response=await route.GET(request(q));assert.equal(response.status,200);assert.deepEqual((await response.json()).places,[]);}
 assert.equal((await route.GET(request('x'.repeat(81)))).status,400);
 assert.equal((await route.GET(request('a b c d e f'))).status,400);
 assert.equal((await route.GET(new NextRequest('https://nippon-map.vercel.app/api/search?q=a&q=b'))).status,400);
 assert.equal(filters.length,0);
 data=[{id:1,name:'東京駅',name_kana:'トウキョウエキ',categories:{slug:'railway',name:'鉄道駅'}},{id:2,name:'東京動物園',categories:[{slug:'zoo',name:'動物園'}]},{id:3,name:'町田リス園',categories:[{slug:'zoo',name:'動物園'}]}];
 let response=await route.GET(request('東京')),body=await response.json();assert.equal(response.status,200);assert.deepEqual(new Set(body.places.map(p=>p.category_slug)),new Set(['railway','zoo']));
 assert.equal((await (await route.GET(request('とうきょうえき'))).json()).places[0].id,1);
 assert.equal((await (await route.GET(request('りす'))).json()).places[0].id,3);
 assert.equal((await (await route.GET(request('ﾘｽ'))).json()).places[0].id,3);
 await route.GET(request('東京%,(駅)'));assert.ok(filters.at(-1).includes('%東京駅%'));assert.ok(!filters.at(-1).includes('('));
 data=[{id:2285,name:'津島熱田温泉',categories:{slug:'roadside-station',name:'道の駅'}}];
 body=await (await route.GET(request('津島やすらぎの里'))).json();assert.equal(body.places[0].id,2285);assert.ok(filters.at(-1).includes('%津島熱田温泉%'));
 data=Array.from({length:501},(_,id)=>({id,name:'東京'+id,categories:{slug:'railway',name:'鉄道駅'}}));ranges=[];
 body=await (await route.GET(request('東京'))).json();assert.equal(body.places.length,100);assert.equal(body.has_more,true);assert.equal(body.partial,false);assert.deepEqual(ranges,[[0,499],[500,999]]);
 error={message:'private database details'};response=await route.GET(request('東京'));assert.equal(response.status,503);assert.ok(!JSON.stringify(await response.json()).includes('private'));
 console.log('Search API tests passed: input limits, kana/readings, joined categories, escaped filters, 501-row pagination and controlled failure.');
})().catch(error=>{console.error(error);process.exit(1)});
