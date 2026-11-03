const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const ts=require("typescript");
function compile(source){return ts.transpileModule(source,{compilerOptions:{target:ts.ScriptTarget.ES2020,module:ts.ModuleKind.CommonJS}}).outputText;}
function shared(){
 const exports={};
 new Function("exports",compile(fs.readFileSync("lib/map-share.ts","utf8")))(exports);
 return exports;
}
async function submit({type="add",cat="aquarium",chosen="park",selected=null,status=200}={}){
 const code=fs.readFileSync("components/MapApp.tsx","utf8");
 const ast=ts.createSourceFile("MapApp.tsx",code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let declaration;
 function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==="submitReport")declaration=n.getText(ast);ts.forEachChild(n,visit);}
 visit(ast);assert.ok(declaration);
 const requests=[],messages=[],guard={current:false};let resets=0;
 const env={reportSubmitting:guard,reportType:type,selected,cat,setReportMsg:v=>messages.push(v),FormData:class {entries(){return Object.entries({category_slug:chosen,name:"検証施設",prefecture_name:"東京都",address:"",note:"公式情報を確認",evidence_url:"",website:""});}},fetch:async(url,init)=>{requests.push({url,body:JSON.parse(init.body)});return {ok:status===200,status,json:async()=>({error:"retry"})};}};
 const exports={};
 new Function(...Object.keys(env),"exports",compile(declaration+"\nexports.run=submitReport;"))(...Object.values(env),exports);
 await exports.run({preventDefault(){},currentTarget:{reset(){resets++;}}});
 return {requests,messages,guard,resets};
}
test("add submission uses the category selected in the form, not the map category",async()=>{
 const r=await submit();assert.equal(r.requests[0].body.category_slug,"park");assert.equal(r.requests[0].body.place_id,null);assert.equal(r.guard.current,false);assert.equal(r.resets,1);
});
test("update and closure retain the selected facility category and ID",async()=>{
 for(const type of ["update","closure"]){
  const r=await submit({type,cat:"aquarium",chosen:"park",selected:{id:2489,category_slug:"aquarium"}});
  assert.equal(r.requests[0].body.category_slug,"aquarium");assert.equal(r.requests[0].body.place_id,2489);
 }
});
test("an unselected map does not override the add-form category and a failed send is retryable",async()=>{
 const r=await submit({cat:null,chosen:"library",status:503});assert.equal(r.requests[0].body.category_slug,"library");assert.equal(r.guard.current,false);assert.equal(r.resets,0);
});
test("restored and generated search queries fit the API normalized 80-character limit",()=>{
 const {readSharedMap,createSharedMapUrl}=shared(),q="あ".repeat(81);
 const restored=readSharedMap("?q="+encodeURIComponent(q),["aquarium"]);
 assert.equal(restored.query.length,80);
 const url=new URL(createSharedMapUrl("https://example.com",{category:"aquarium",prefecture:"東京都",query:q,placeId:2489,city:"港区"}));
 assert.equal(url.searchParams.get("q").length,80);
 const round=readSharedMap(url.search,["aquarium"]);assert.equal(round.city,"港区");assert.equal(round.placeId,2489);assert.equal(round.prefecture,"東京都");
});
test("compatibility characters are normalized before applying the shared query limit",()=>{
 const {readSharedMap,createSharedMapUrl}=shared(),q="㍿".repeat(30);
 const state=readSharedMap("?q="+encodeURIComponent(q),[]);
 assert.equal(state.query.normalize("NFKC").length,80);
 const url=new URL(createSharedMapUrl("https://example.com",{category:null,prefecture:null,query:q,placeId:null}));
 assert.equal(url.searchParams.get("q").normalize("NFKC").length,80);
});
