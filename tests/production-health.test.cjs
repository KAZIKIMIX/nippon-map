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
console.log('Monitoring failure tests passed: upstream outage and empty sitemap produce nonzero exits; no production requests.');
