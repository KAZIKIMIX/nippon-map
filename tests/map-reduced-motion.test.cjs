const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const ts=require('typescript');
const compile=s=>ts.transpileModule(s,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function ast(){return ts.createSourceFile('MapApp.tsx',fs.readFileSync('components/MapApp.tsx','utf8'),ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);}
test('every flyTo respects the user reduced-motion setting',()=>{
 const source=ast();const flags=[];function visit(n){if(ts.isCallExpression(n)&&ts.isPropertyAccessExpression(n.expression)&&n.expression.name.text==='flyTo'){const options=n.arguments[0];assert.ok(ts.isObjectLiteralExpression(options));const essential=options.properties.find(p=>ts.isPropertyAssignment(p)&&p.name.getText(source)==='essential');flags.push(essential?essential.initializer.getText(source):'false');}ts.forEachChild(n,visit);}visit(source);
 assert.equal(flags.length,3);assert.ok(flags.every(v=>v==='false'),'flyTo must not force essential motion');
});
test('facility selection still moves to the facility with the mobile offset',()=>{
 const source=ast();let effect;function visit(n){if(ts.isCallExpression(n)&&n.expression.getText(source)==='useEffect'&&n.arguments[0]?.getText(source).includes('const move=()=>'))effect=n.arguments[0].getText(source);ts.forEachChild(n,visit);}visit(source);assert.ok(effect);
 for(const width of [390,1363]){let options;const m={stop(){},getZoom:()=>4,getContainer:()=>({clientHeight:500}),flyTo:o=>options=o};const map={current:m};const selected={id:1,latitude:35.6,longitude:139.7};const exports={};new Function('map','selected','window','exports',compile('exports.run='+effect))(map,selected,{innerWidth:width},exports);exports.run();assert.deepEqual(options.center,[139.7,35.6]);assert.equal(options.zoom,13);assert.equal(options.duration,1000);assert.deepEqual(options.offset,width<=900?[0,-110]:[0,0]);assert.notEqual(options.essential,true);}
});
