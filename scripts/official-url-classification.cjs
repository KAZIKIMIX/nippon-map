// HTTP availability is not proof of station identity or current operation.
function classifyResponse(status,contentType='',sample=''){
 if(status===403)return 'access_restricted_403';
 if(status===429)return 'rate_limited_429';
 if(status===404)return 'not_found_404';
 if(status===410)return 'gone_410';
 if(status>=500)return 'server_error';
 if(status>=400)return 'http_error';
 if(status<200||status>=400)return 'other';
 if(status===204||status===205)return 'empty_response';
 if(/html/i.test(contentType)){
  if(/\/_Incapsula_Resource\b|_cf_chl_opt\b|\/cdn-cgi\/challenge-platform\//i.test(sample))return 'access_control_page';
  if(/<frameset\b|<frame\s/i.test(sample))return 'frameset_requires_content_review';
  const title=sample.match(/<title\b[^>]*>([\s\S]*?)<\/title>/i)?.[1]||'';
  if(/メンテナンス中|緊急メンテナンス|under maintenance|temporarily unavailable/i.test(title))return 'maintenance_page';
 }
 return 'http_ok_content_unverified';
}
async function readResponseSample(response,maxBytes=65536){
 const reader=response.body?.getReader();
 if(!reader)return {text:'',bytes:0,truncated:false};
 const chunks=[];let bytes=0,truncated=false;
 try{
  while(bytes<maxBytes){const {done,value}=await reader.read();if(done)break;const kept=value.subarray(0,maxBytes-bytes);chunks.push(kept);bytes+=kept.length;if(kept.length<value.length||bytes===maxBytes){truncated=true;break}}
 }finally{try{await reader.cancel()}catch{}}
 return {text:Buffer.concat(chunks.map(x=>Buffer.from(x))).toString('utf8'),bytes,truncated};
}
module.exports={classifyResponse,readResponseSample};
