const assert=require('node:assert/strict');
const {spawnSync}=require('node:child_process');
function run(script,setup){
 return spawnSync(process.execPath,['-e',setup+';require('+JSON.stringify('./'+script)+')'],{cwd:process.cwd(),encoding:'utf8',timeout:5000,env:{...process.env,BASE_URL:'https://nippon-map.vercel.app'}});
}
// A total upstream outage must make the monitoring process fail, even when
// individual requests are caught so that the rest of the checks can continue.
const smoke=run('scripts/smoke-production.cjs',"global.fetch=async()=>{throw new Error('simulated outage')}");
assert.equal(smoke.error,undefined);
assert.equal(smoke.status,1);
assert.match(smoke.stderr,/FAIL live data/);
assert.match(smoke.stdout,/Smoke summary:/);
const seo=run('scripts/check-production-seo.cjs',"global.fetch=async()=>({status:200,text:async()=>'<urlset></urlset>'})");
assert.equal(seo.error,undefined);
assert.equal(seo.status,1);
assert.match(seo.stderr,/Sitemap empty/);
const {verifySearchDetails}=require('../scripts/check-search-flow.cjs');
const station={id:9542,name:'東京駅',category_slug:'railway',prefecture_name:'東京都',latitude:35.6777,longitude:139.7652};
const response=body=>({status:200,headers:{get:()=> 'application/json'},json:async()=>body});
(async()=>{
 const calls=[];
 const id=await verifySearchDetails('https://example.test',async url=>{calls.push(url);return response(url.includes('/api/search?')?{places:[station]}:{details:{routes:['京葉線'],operators:['東日本旅客鉄道']}})});
 assert.equal(id,9542);assert.equal(calls.length,2);assert.match(calls[1],/id=9542$/);
 await assert.rejects(verifySearchDetails('https://example.test',async()=>response({places:[]})),/missing from filtered search/);
 await assert.rejects(verifySearchDetails('https://example.test',async url=>response(url.includes('/api/search?')?{places:[{...station,latitude:null}]}:{details:null})),/Invalid search latitude/);
 await assert.rejects(verifySearchDetails('https://example.test',async url=>response(url.includes('/api/search?')?{places:[station]}:{details:null})),/station routes/);
 console.log('Monitoring tests passed: outage, empty sitemap, empty search, invalid coordinates and missing details are detected; no production requests.');
})().catch(error=>{console.error(error);process.exitCode=1});
