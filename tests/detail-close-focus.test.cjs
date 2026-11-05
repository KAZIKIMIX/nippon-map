const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../components/MapApp.tsx'),'utf8');
const ast=ts.createSourceFile('MapApp.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
function setup({visible=true,present=true,id=2489}={}){
 let fn;function visit(n){if(ts.isFunctionDeclaration(n)&&n.name?.text==='closePlaceDetails')fn=n.getText(ast);ts.forEachChild(n,visit)}visit(ast);
 assert.ok(fn,'close handler must restore focus');
 const events=[],frames=[],queries=[];
 const result={getClientRects:()=>visible?[{}]:[],focus:()=>events.push('result-focus')};
 const input={focus:()=>events.push('search-focus')};
 const context={selected:id==null?null:{id},setSelected:v=>events.push(v),requestAnimationFrame:cb=>frames.push(cb),document:{querySelector:selector=>{queries.push(selector);return selector.startsWith('button[')?(present?result:null):input}}};
 vm.createContext(context);
 vm.runInContext(ts.transpileModule(fn,{compilerOptions:{target:ts.ScriptTarget.ES2020}}).outputText,context);
 return {context,events,frames,queries};
}
test('close waits for layout update then restores the selected result',()=>{
 const c=setup();c.context.closePlaceDetails();assert.deepEqual(c.events,[null]);assert.equal(c.frames.length,1);c.frames[0]();assert.deepEqual(c.events,[null,'result-focus']);assert.ok(c.queries[0].includes('2489'));
});
test('removed result falls back to search input',()=>{const c=setup({present:false});c.context.closePlaceDetails();c.frames[0]();assert.deepEqual(c.events,[null,'search-focus']);});
test('hidden result falls back to search input',()=>{const c=setup({visible:false});c.context.closePlaceDetails();c.frames[0]();assert.deepEqual(c.events,[null,'search-focus']);});
test('close button and result identity are wired to the restoration handler',()=>{
 assert.ok(source.includes('aria-label="施設の詳細を閉じる" onClick={closePlaceDetails}'));
 assert.ok(source.includes('data-place-result={p.id}'));
});
