const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {spawnSync}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'n03-test-'));
const input=path.join(dir,'test.geojson'),output=path.join(dir,'output.csv');
const polygon={type:'Polygon',coordinates:[[[139,35],[140,35],[140,36],[139,35]]]};
const feature=(code,city,district='')=>({type:'Feature',properties:{N03_007:code,N03_004:city,N03_003:district},geometry:polygon});
function run(features){fs.writeFileSync(input,JSON.stringify({type:'FeatureCollection',features}));return spawnSync(process.execPath,['scripts/export-n03.cjs',input,output,'2025','https://example.go.jp/n03'],{encoding:'utf8'});}
let r=run([feature('01334','木古内町','上磯郡'),feature('13103','港区')]);
assert.equal(r.status,0,r.stderr);
const csv=fs.readFileSync(output,'utf8');
assert.match(csv,/上磯郡木古内町/);assert.match(csv,/港区/);
// Designated-city ward codes must include both city and ward names.
fs.unlinkSync(output);
fs.writeFileSync(input,JSON.stringify({type:'FeatureCollection',features:[{type:'Feature',properties:{N03_007:'14101',N03_004:'横浜市',N03_005:'鶴見区'},geometry:polygon}]}));
let ward=spawnSync(process.execPath,['scripts/export-n03.cjs',input,output,'2026','https://example.go.jp/n03'],{encoding:'utf8'});
assert.equal(ward.status,0,ward.stderr);
assert.match(fs.readFileSync(output,'utf8'),/横浜市鶴見区/);
fs.unlinkSync(output);
r=run([feature('01334','木古内町','上磯郡'),feature('01334','異なる町','上磯郡')]);
assert.notEqual(r.status,0);
assert.equal(fs.existsSync(output),false);
r=run([feature('','不明')]);
assert.notEqual(r.status,0);
assert.equal(fs.existsSync(output),false);
// The exporter must never overwrite its input file.
r=spawnSync(process.execPath,['scripts/export-n03.cjs',input,input,'2025','https://example.go.jp/n03'],{encoding:'utf8'});
assert.notEqual(r.status,0);
assert.ok(fs.existsSync(input));
// Reject unclosed rings and impossible latitude values.
assert.equal(fs.existsSync(output),false);
const badPolygon={type:'Polygon',coordinates:[[[139,35],[140,35],[140,36],[139,36]]]};
fs.writeFileSync(input,JSON.stringify({type:'FeatureCollection',features:[{...feature('13103','港区'),geometry:badPolygon}]}));
r=spawnSync(process.execPath,['scripts/export-n03.cjs',input,output,'2026','https://example.go.jp/n03'],{encoding:'utf8'});
assert.notEqual(r.status,0);
assert.equal(fs.existsSync(output),false);
const impossible={type:'Polygon',coordinates:[[[139,95],[140,95],[140,96],[139,95]]]};
fs.writeFileSync(input,JSON.stringify({type:'FeatureCollection',features:[{...feature('13103','港区'),geometry:impossible}]}));
r=spawnSync(process.execPath,['scripts/export-n03.cjs',input,output,'2026','https://example.go.jp/n03'],{encoding:'utf8'});
assert.notEqual(r.status,0);
assert.equal(fs.existsSync(output),false);
fs.rmSync(dir,{recursive:true,force:true});
console.log('PASS N03 export: valid polygons, duplicate conflict, invalid code');
