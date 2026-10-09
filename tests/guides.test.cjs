const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
function compile(path,req=require){const output=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;const m={exports:{}};new Function('exports','module','require',output)(m.exports,m,req);return m.exports;}
const guides=compile('lib/guide-categories.ts');
assert.equal(guides.isGuideCategory('aquarium'),true);assert.equal(guides.isGuideCategory('toString'),false);assert.equal(guides.isGuideCategory('unknown'),false);
assert.equal(guides.safeOfficialUrl('javascript:alert(1)'),null);assert.equal(guides.safeOfficialUrl('https://example.com/'),'https://example.com/');
const groups=guides.groupGuidePlaces([{id:2,name:'B',prefecture_name:'東京都'},{id:1,name:'A',prefecture_name:'北海道'},{id:3,name:'C',prefecture_name:'東京都'}]);assert.deepEqual(groups.map(g=>[g.prefecture,g.places.length]),[['北海道',1],['東京都',2]]);
let calls=[],fail=false;
const all=Array.from({length:1234},(_,i)=>({id:i+1,name:'施設'+i,category_slug:'roadside-station',prefecture_name:'北海道'}));
const data=compile('lib/guide-data.ts',name=>name==='react'?{cache:fn=>fn}:name==='@supabase/supabase-js'?{createClient:()=>({rpc:(_name,args)=>({order:(column)=>({range:async(from,to)=>{calls.push({column,from,to,args});return fail?{data:null,error:{message:'internal'}}:{data:all.slice(from,to+1),error:null};}})})})}:require(name));
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public-key';
(async()=>{const places=await data.getGuidePlaces('roadside-station');assert.equal(places.length,1234);assert.equal(new Set(places.map(p=>p.id)).size,1234);assert.equal(calls.length,2);assert.equal(calls[1].from,1000);assert.equal(calls[0].column,'id');fail=true;await assert.rejects(data.getGuidePlaces('aquarium'),/掲載一覧を取得できませんでした/);console.log('Guide tests passed: 1,234-row pagination, stable order, grouping, invalid slugs/URLs, database failure.');})().catch(e=>{console.error(e);process.exit(1);});
