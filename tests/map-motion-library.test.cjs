const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const ts=require('typescript');
test('actual MapLibre flyTo selects jumpTo only when reduced motion is enabled',()=>{
 const media={matches:true};const previous=global.matchMedia;
 global.matchMedia=()=>media;
 try{
  const {Map:LibreMap}=require('maplibre-gl');
  const source=ts.createSourceFile('MapApp.tsx',fs.readFileSync('components/MapApp.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);let effect;
  function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(source)==='useEffect'&&n.arguments[0]?.getText(source).includes('const move=()=>'))effect=n.arguments[0].getText(source);ts.forEachChild(n,visit);}visit(source);assert.ok(effect);
  const js=ts.transpileModule('exports.run='+effect,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
  for(const reduced of [true,false]){
   media.matches=reduced;let jumps=0,animationEntries=0,received;
   const branch=Symbol('animation entered');
   const receiver={jumpTo(options){jumps++;received=options;return this;},stop(){animationEntries++;throw branch;}};
   const m={stop(){},getZoom:()=>4,getContainer:()=>({clientHeight:500}),flyTo:options=>LibreMap.prototype.flyTo.call(receiver,options)};
   const exports={};new Function('map','selected','window','exports',js)({current:m},{id:1,latitude:35.6,longitude:139.7},{innerWidth:390},exports);
   if(reduced){exports.run();assert.equal(jumps,1);assert.equal(animationEntries,0);assert.deepEqual(received.center,[139.7,35.6]);assert.equal(received.zoom,13);}
   else{assert.throws(()=>exports.run(),e=>e===branch);assert.equal(jumps,0);assert.equal(animationEntries,1);}
  }
 }finally{if(previous===undefined)delete global.matchMedia;else global.matchMedia=previous;}
});
