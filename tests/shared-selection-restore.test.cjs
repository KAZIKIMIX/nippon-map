const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
const helpers={};new Function('exports',compile(fs.readFileSync('lib/search-results.ts','utf8')))(helpers);
const place={id:2489,name:'マクセル アクアパーク品川',name_kana:'マクセル アクアパークシナガワ',category_slug:'aquarium',prefecture_name:'東京都',municipality_name:'港区',address:'東京都港区高輪4-10-30'};
function restore(query,overrides={}){
 const source=fs.readFileSync('components/MapApp.tsx','utf8');const ast=ts.createSourceFile('MapApp.tsx',source,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let effect;
 function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(ast)==='useEffect'&&n.arguments[0]?.getText(ast).includes('loadedPlacesScope.current!=='))effect=n.arguments[0].getText(ast);ts.forEachChild(n,visit);}visit(ast);assert.ok(effect);
 const selected=[],pending={current:2489};
 const env={loaded:true,pendingSharedPlace:pending,cat:'aquarium',prefecture:'東京都',loadedPlacesScope:{current:'aquarium:東京都'},places:[place],cityFilter:'',normalizedQ:helpers.normalizeSearchText(query),normalizeSearch:helpers.normalizeSearchText,setSelected:p=>selected.push(p),...overrides};
 const exports={};new Function(...Object.keys(env),'exports',compile('exports.run='+effect))(...Object.values(env),exports);exports.run();return {selected,pending};
}
test('shared selection restores when search terms match different facility fields',()=>{assert.equal(restore('東京都 品川').selected[0]?.id,2489);});
test('shared selection restores a reading query accepted by search',()=>{assert.equal(restore('しながわ').selected[0]?.id,2489);});
test('single term and unfiltered shared facility selection still restore',()=>{for(const q of ['品川',''])assert.equal(restore(q).selected[0]?.id,2489);});
test('restoration does not bypass city, category or unmatched search terms',()=>{
 assert.equal(restore('東京都 大阪').selected.length,0);
 assert.equal(restore('品川',{cityFilter:'品川区'}).selected.length,0);
 assert.equal(restore('品川',{places:[{...place,category_slug:'park'}]}).selected.length,0);
});
test('stale scope and incomplete loads preserve pending selection',()=>{for(const overrides of [{loaded:false},{loadedPlacesScope:{current:'park:東京都'}}]){const r=restore('品川',overrides);assert.equal(r.selected.length,0);assert.equal(r.pending.current,2489);}});
