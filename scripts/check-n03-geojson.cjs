const fs=require('node:fs');
const file=process.argv[2];
if(!file)throw Error('Usage: node scripts/check-n03-geojson.cjs input.geojson');
const data=JSON.parse(fs.readFileSync(file,'utf8'));
if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('Not a GeoJSON FeatureCollection');
const seen=new Map();let invalid=0;
const ringValid=ring=>Array.isArray(ring)&&ring.length>=4&&ring.every(p=>Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1])&&Math.abs(p[0])<=180&&Math.abs(p[1])<=90)&&ring[0][0]===ring[ring.length-1][0]&&ring[0][1]===ring[ring.length-1][1];
const polygonValid=p=>Array.isArray(p)&&p.length>0&&p.every(ringValid);
const geomValid=g=>g&&(g.type==='Polygon'?polygonValid(g.coordinates):g.type==='MultiPolygon'&&Array.isArray(g.coordinates)&&g.coordinates.length>0&&g.coordinates.every(polygonValid));
for(const f of data.features){const p=f.properties||{};const code=String(p.N03_007||'');const name=String(p.N03_004||'');if(!/^\d{5}$/.test(code)||!name||!geomValid(f.geometry)){invalid++;continue}if(seen.has(code)&&seen.get(code)!==name)throw Error('Conflicting municipality name for '+code);seen.set(code,name)}
console.log(JSON.stringify({features:data.features.length,municipalities:seen.size,invalid},null,2));
if(invalid)process.exitCode=1;
