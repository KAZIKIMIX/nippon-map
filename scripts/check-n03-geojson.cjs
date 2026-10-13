const fs=require('node:fs');
const file=process.argv[2];
if(!file)throw Error('Usage: node scripts/check-n03-geojson.cjs input.geojson');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('Not a GeoJSON FeatureCollection');
const seen=new Map();let invalid=0;
for(const f of data.features){const p=f.properties||{};const code=String(p.N03_007||'');const name=String(p.N03_004||'');if(!/^\d{5}$/.test(code)||!name||!['Polygon','MultiPolygon'].includes(f.geometry?.type)){invalid++;continue}if(seen.has(code)&&seen.get(code)!==name)throw Error('Conflicting municipality name for '+code);seen.set(code,name)}
console.log(JSON.stringify({features:data.features.length,municipalities:seen.size,invalid},null,2));
if(invalid)process.exitCode=1;
