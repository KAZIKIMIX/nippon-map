const fs=require('node:fs'),ts=require('typescript'),assert=require('node:assert/strict');
const source=fs.readFileSync('lib/map-share.ts','utf8');
const mod={exports:{}};
new Function('exports','module',ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText)(mod.exports,mod);
const {readSharedMap,createSharedMapUrl}=mod.exports;
const categories=['aquarium','railway','airport'];
// A search without a selected category must survive sharing and reloading.
const global={category:null,prefecture:null,query:'品川',city:'',placeId:null};
assert.deepEqual(readSharedMap(new URL(createSharedMapUrl('https://example.com',global)).search,categories),global);
// Existing scoped and per-facility links remain compatible.
const scoped={category:'aquarium',prefecture:'東京都',query:'品川',city:'港区',placeId:2489};
assert.deepEqual(readSharedMap(new URL(createSharedMapUrl('https://example.com',scoped)).search,categories),scoped);
assert.deepEqual(readSharedMap('?category=aquarium&place=2489',categories),{category:'aquarium',prefecture:null,query:'',city:'',placeId:2489});
const invalid=readSharedMap('?category=invalid&prefecture=東京都&city=港区&place=2489&q=品川',categories);
assert.equal(invalid.category,null);assert.equal(invalid.prefecture,null);assert.equal(invalid.placeId,null);assert.equal(invalid.city,'');assert.equal(invalid.query,'品川');
assert.equal(readSharedMap('?q='+encodeURIComponent('あ'.repeat(120)),categories).query.length,100);
const url=new URL(createSharedMapUrl('https://example.com',{...global,query:' A&B #東京 '}));
assert.equal(url.searchParams.get('q'),'A&B #東京');assert.equal(url.hash,'');
console.log('Map sharing regression passed: global search, scoped search, place links, invalid scope, encoding and length.');
