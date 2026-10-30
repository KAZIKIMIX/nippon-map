const assert=require('node:assert/strict');
const {classifyResponse,readResponseSample}=require('../scripts/official-url-classification.cjs');
assert.equal(classifyResponse(200,'text/html','<script src="/_Incapsula_Resource?x=1"></script>'),'access_control_page');
assert.equal(classifyResponse(200,'text/html','<script>window._cf_chl_opt={}</script>'),'access_control_page');
assert.equal(classifyResponse(200,'text/html','<frameset><frame src="sheet001.html"></frameset>'),'frameset_requires_content_review');
assert.equal(classifyResponse(200,'text/html','<iframe src="map.html"></iframe><h1>駅情報</h1>'),'http_ok_content_unverified');
assert.equal(classifyResponse(200,'text/html','<title>緊急メンテナンス</title>'),'maintenance_page');
assert.equal(classifyResponse(200,'text/html','<title>駅情報</title><a>メンテナンス情報</a>'),'http_ok_content_unverified');
assert.equal(classifyResponse(200,'application/pdf',''),'http_ok_content_unverified');
assert.equal(classifyResponse(204),'empty_response');
for(const [status,label] of [[403,'access_restricted_403'],[429,'rate_limited_429'],[404,'not_found_404'],[410,'gone_410'],[503,'server_error']])assert.equal(classifyResponse(status,'text/html','<title>駅情報</title>'),label);
(async()=>{
 let cancelled=false;
 const response={body:new ReadableStream({start(c){c.enqueue(new Uint8Array(100000).fill(65));},cancel(){cancelled=true;}})};
 const sample=await readResponseSample(response,65536);
 assert.equal(sample.bytes,65536);assert.equal(sample.text.length,65536);assert.equal(sample.truncated,true);assert.equal(cancelled,true);
 const empty=await readResponseSample({body:null});assert.deepEqual(empty,{text:'',bytes:0,truncated:false});
 console.log('Official URL audit: soft blocks, frames, maintenance, status precedence and bounded reads passed; no network or DB access.');
})().catch(e=>{console.error(e);process.exitCode=1});
