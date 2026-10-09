const fs=require('fs'),ts=require('typescript'),assert=require('node:assert/strict');
const {NextRequest}=require('next/server');
function compile(path,customRequire=require){
 const output=ts.transpileModule(fs.readFileSync(path,'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
 const module={exports:{}};new Function('exports','module','require',output)(module.exports,module,customRequire);return module.exports;
}
const events=compile('lib/usage-events.ts');
assert.deepEqual(events.parseUsagePayload({event:'place_open',category:'aquarium',source:'x'}),{event:'place_open',category:'aquarium',source:'x'});
for(const value of [{event:'place_open',category:null,source:'x'},{event:'page_view',category:null,source:'direct',query:'private'},{event:'page_view',category:null,source:'invalid'}])assert.equal(events.parseUsagePayload(value),null);
assert.equal(events.classifyUsageSource('https://google.com.evil.test/','https://nippon-map.vercel.app',null),'other');
assert.equal(events.classifyUsageSource('https://www.google.co.jp/search?q=private','https://nippon-map.vercel.app',null),'search');
assert.equal(events.classifyUsageSource('','https://nippon-map.vercel.app','x'),'x');
let inserted=[];let fail=false;
const route=compile('app/api/usage/route.ts',name=>name==='../../../lib/usage-events'?events:name==='@supabase/supabase-js'?{createClient:()=>({from:()=>({insert:async row=>{inserted.push(row);return {error:fail?{message:'private database detail'}:null};}})})}:require(name));
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public-key';
function request(body,headers={}){return new NextRequest('https://nippon-map.vercel.app/api/usage',{method:'POST',headers:{origin:'https://nippon-map.vercel.app','content-type':'application/json',...headers},body:typeof body==='string'?body:JSON.stringify(body)});}
(async()=>{
 const valid={event:'page_view',category:null,source:'direct'};
 assert.equal((await route.POST(request(valid))).status,204);
 assert.deepEqual(inserted,[{event_name:'page_view',category_slug:null,source:'direct'}]);
 assert.equal((await route.POST(request({...valid,query:'private'}))).status,400);
 assert.equal((await route.POST(request(valid,{origin:'https://other.example'}))).status,403);
 assert.equal((await route.POST(request('x'.repeat(513)))).status,413);
 assert.equal((await route.POST(request(valid,{dnt:'1'}))).status,204);
 assert.equal((await route.POST(request(valid,{'sec-gpc':'1'}))).status,204);
 assert.equal(inserted.length,1);
 fail=true;const unavailable=await route.POST(request(valid));assert.equal(unavailable.status,503);assert.equal((await unavailable.json()).error,'Usage unavailable');
 let disabled=null,sent=[];
 global.window={location:{origin:'https://nippon-map.vercel.app',search:'?q=private&place=2527&utm_source=x'}};
 global.document={referrer:'https://google.com/search?q=private'};
 Object.defineProperty(global,'navigator',{value:{doNotTrack:'1'},configurable:true,writable:true});
 global.localStorage={getItem:()=>disabled,setItem:(_key,value)=>{disabled=value;},removeItem:()=>{disabled=null;}};
 global.fetch=async (_url,options)=>{sent.push(JSON.parse(options.body));};
 const client=compile('lib/usage-client.ts',name=>name==='./usage-events'?events:require(name));
 client.trackUsage('page_view');assert.equal(sent.length,0);
 global.navigator.doNotTrack='0';client.setUsageDisabled(true);client.trackUsage('page_view');assert.equal(sent.length,0);
 client.setUsageDisabled(false);client.trackUsage('place_open','aquarium');assert.deepEqual(sent,[{event:'place_open',category:'aquarium',source:'x'}]);
 global.navigator.globalPrivacyControl=true;client.trackUsage('page_view');assert.equal(sent.length,1);
 console.log('Usage tests passed: validation, private-field rejection, origin/body checks, failure handling, DNT/GPC and opt-out.');
})().catch(error=>{console.error(error);process.exit(1);});
