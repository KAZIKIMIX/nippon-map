const assert=require("node:assert/strict");
const base=(process.env.BASE_URL||"https://nippon-map.vercel.app").replace(/\/$/,"");
const endpoints=["/api/place-details?id=9542","/api/search?q=%E6%9D%B1%E4%BA%AC%E9%A7%85","/api/places?category=airport&summary=1"];
(async()=>{
 let failed=0;
 for(const path of endpoints){
  const durations=[];
  for(let attempt=0;attempt<2;attempt++){
   try{
    const start=performance.now();
    const response=await fetch(base+path,{signal:AbortSignal.timeout(20000),redirect:"error"});
    const elapsed=Math.round(performance.now()-start);
    assert.equal(response.status,200,path+" returned "+response.status);
    const body=await response.json();
    assert.ok(body&&typeof body==="object"&&!body.error,"API error");
    durations.push(elapsed);
    console.log(JSON.stringify({path,attempt:attempt+1,status:response.status,elapsed_ms:elapsed,server_timing:response.headers.get("server-timing"),cache:response.headers.get("x-vercel-cache"),age:response.headers.get("age")}));
   }catch(error){failed++;console.error("FAIL",path,error.message);break;}
  }
 }
 if(failed)process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
