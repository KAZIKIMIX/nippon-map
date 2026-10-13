const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {spawnSync}=require('node:child_process');
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'n03-preflight-')),file=path.join(dir,'test.geojson');
const polygon={type:'Polygon',coordinates:[[[139,35],[140,35],[140,36],[139,35]]]};
function run(features){fs.writeFileSync(file,JSON.stringify({type:'FeatureCollection',features}));return spawnSync(process.execPath,['scripts/check-n03-geojson.cjs',file],{encoding:'utf8'})}
const valid={type:'Feature',properties:{N03_007:'13103',N03_004:'港区'},geometry:polygon};
assert.equal(run([valid]).status,0);
assert.notEqual(run([{...valid,properties:{...valid.properties,N03_007:'bad'}}]).status,0);
assert.notEqual(run([{...valid,geometry:{type:'Polygon',coordinates:[[[139,35],[140,35],[140,36],[139,36]]]}}]).status,0);
assert.notEqual(run([valid,{...valid,properties:{N03_007:'13103',N03_004:'別名区'}}]).status,0);
fs.rmSync(dir,{recursive:true,force:true});
console.log('PASS N03 preflight');
