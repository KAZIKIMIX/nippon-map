const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const ts=require('typescript');
function harness(){
 const effects=[],events=[],states=[];let cursor=0;
 const hooks={useEffect:f=>effects.push(f),useRef:v=>({current:v}),useState:v=>{const i=cursor++;if(!(i in states))states[i]=v;return [states[i],v=>states[i]=typeof v==='function'?v(states[i]):v];}};
 const jsx=(type,props)=>({type,props:props||{}}),runtime={jsx,jsxs:jsx,Fragment:'fragment'},cache=new Map();
 function load(path){
  if(cache.has(path))return cache.get(path);
  const m={exports:{}};
  const req=name=>{
   if(name==='react')return hooks;
   if(name==='react/jsx-runtime')return runtime;
   if(name==='next/navigation')return {redirect:()=>{throw Error('unexpected redirect')}};
   if(name.endsWith('.css'))return new Proxy({},{get:(_,key)=>String(key)});
   if(name.endsWith('/usage-client'))return {trackUsage:(...args)=>events.push(args)};
   const names={'../components/CategoryDirectory':'components/CategoryDirectory.tsx','../components/HomeVisitTracker':'components/HomeVisitTracker.tsx','../lib/landing-links':'lib/landing-links.ts','../lib/map-categories':'lib/map-categories.ts','./map-categories':'lib/map-categories.ts'};
   if(names[name])return load(names[name]);
   throw Error('Unexpected import '+name);
  };
  const result=ts.transpileModule(fs.readFileSync(path,'utf8'),{fileName:path,compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020,jsx:ts.JsxEmit.ReactJSX}});
  new Function('exports','module','require','document',result.outputText)(m.exports,m,req,{getElementById:()=>null});cache.set(path,m.exports);return m.exports;
 }
 function walk(node,visit){if(Array.isArray(node)){node.forEach(n=>walk(n,visit));return}if(!node||typeof node!=='object')return;visit(node);walk(node.props?.children,visit);}
 function expand(node){if(Array.isArray(node))return node.map(expand);if(!node||typeof node!=='object')return node;if(typeof node.type==='function')return expand(node.type(node.props));return {...node,props:{...node.props,children:expand(node.props.children)}};}
 function text(node){if(Array.isArray(node))return node.map(text).join('');if(node==null||typeof node==='boolean')return '';if(typeof node!=='object')return String(node);return text(node.props.children);}
 return {load,walk,expand,text,events,effects,renderDirectory(){cursor=0;return load('components/CategoryDirectory.tsx').default();}};
}
test('one homepage mount emits exactly one page_view without sending network events',async()=>{
 const h=harness();h.expand(await h.load('app/page.tsx').default({searchParams:Promise.resolve({})}));h.effects.forEach(f=>f());assert.deepEqual(h.events,[['page_view']]);
});
test('empty category search recovery expands every category, then can return to featured',()=>{
 const h=harness();const find=(tree,p)=>{let found;h.walk(tree,n=>{if(p(n))found=n});assert.ok(found);return found;};
 let tree=h.renderDirectory();find(tree,n=>n.type==='input').props.onChange({target:{value:'zzzz-not-a-category'}});
 tree=h.renderDirectory();find(tree,n=>n.type==='button'&&h.text(n)==='すべてのカテゴリを表示').props.onClick();
 tree=h.renderDirectory();let links=[];h.walk(tree,n=>{if(n.type==='a')links.push(n)});assert.equal(links.length,h.load('lib/map-categories.ts').mapCategories.length);
 find(tree,n=>n.type==='button'&&h.text(n)==='おすすめカテゴリに戻す ↑').props.onClick();tree=h.renderDirectory();links=[];h.walk(tree,n=>{if(n.type==='a')links.push(n)});assert.equal(links.length,8);
});
test('legacy map redirect preserves city, prefecture, selected place and X attribution',()=>{
 const h=harness(),{legacyMapPath}=h.load('lib/landing-links.ts');const url=new URL(legacyMapPath({category:'aquarium',prefecture:'東京都',city:'港区',place:'2489',q:'品川',utm_source:'x',redirect:'https://unrelated.example'}),'https://example.com');
 assert.equal(url.pathname,'/map');assert.equal(url.searchParams.get('city'),'港区');assert.equal(url.searchParams.get('prefecture'),'東京都');assert.equal(url.searchParams.get('place'),'2489');assert.equal(url.searchParams.get('utm_source'),'x');assert.equal(url.searchParams.has('redirect'),false);
 assert.equal(new URL(legacyMapPath({map:'1',city:['港区','品川区']}),'https://example.com').searchParams.get('city'),'港区');assert.equal(legacyMapPath({category:'invalid',city:'港区'}),null);
});
