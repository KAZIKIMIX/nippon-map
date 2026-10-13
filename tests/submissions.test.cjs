const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const {NextRequest}=require('next/server');
let rows=[],fail=false;
const output=ts.transpileModule(fs.readFileSync('app/api/submissions/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const api={exports:{}};new Function('exports','module','require',output)(api.exports,api,name=>name==='@supabase/supabase-js'?{createClient:()=>({from:()=>({insert:row=>({abortSignal:async()=>{rows.push(row);return {error:fail?{message:'private'}:null}}})})})}:require(name));
process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY='test-public-key';
const valid={submission_type:'add',category_slug:'zoo',name:'テスト施設',prefecture_name:'東京都'};
const request=(body,headers={})=>new NextRequest('https://nippon-map.vercel.app/api/submissions',{method:'POST',headers:{origin:'https://nippon-map.vercel.app',...headers},body:typeof body==='string'?body:JSON.stringify(body)});
(async()=>{
 assert.equal((await api.exports.POST(request(valid,{origin:'https://other.example'}))).status,403);
 assert.equal((await api.exports.POST(request('x'.repeat(12001)))).status,413);
 assert.equal((await api.exports.POST(request(valid,{'content-length':'12001'}))).status,413);
 for(const value of [[],null,{...valid,name:''},{...valid,name:'a'.repeat(161)},{...valid,evidence_url:'javascript:alert(1)'},{...valid,submission_type:'update'},{...valid,category_slug:'invalid'},{...valid,contact_email:'invalid'}])assert.equal((await api.exports.POST(request(value))).status,400);
 assert.equal(rows.length,0);assert.equal((await api.exports.POST(request(valid))).status,200);assert.equal(rows[0].status,'pending');assert.equal(rows[0].contact_email,null);
 fail=true;const response=await api.exports.POST(request(valid));assert.equal(response.status,503);assert.ok(!JSON.stringify(await response.json()).includes('private'));
 console.log('Submission tests passed: origin/body limits, validation, pending-only writes and controlled failures; no production writes.');
})().catch(error=>{console.error(error);process.exit(1)});
