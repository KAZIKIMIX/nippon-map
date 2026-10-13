// Validate N03 GeoJSON and export a CSV suitable for municipality_boundaries_staging.
const fs=require('node:fs');
const [input,output,year,url]=process.argv.slice(2);
const crypto=require('node:crypto');
if(!input||!output||!/^[0-9]{4}$/.test(year||'')||!/^https:\/\//.test(url||''))throw Error('Usage: node scripts/export-n03.cjs input.geojson output.csv YEAR https://source-url');
const data=JSON.parse(fs.readFileSync(input,'utf8'));
if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('Expected FeatureCollection');
const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
const ringValid=ring=>Array.isArray(ring)&&ring.length>=4&&ring.every(pt=>Array.isArray(pt)&&pt.length>=2&&Number.isFinite(pt[0])&&Number.isFinite(pt[1])&&Math.abs(pt[0])<=180&&Math.abs(pt[1])<=90)&&ring[0][0]===ring[ring.length-1][0]&&ring[0][1]===ring[ring.length-1][1];
const polygonValid=rings=>Array.isArray(rings)&&rings.length>0&&rings.every(ringValid);
const geometryValid=g=>g&&(g.type==='Polygon'?polygonValid(g.coordinates):g.type==='MultiPolygon'&&Array.isArray(g.coordinates)&&g.coordinates.length>0&&g.coordinates.every(polygonValid));
const names=new Map(),rows=['municipality_code,municipality_name,geometry_geojson,source_year,source_url'];
for(const f of data.features){
 const p=f.properties||{},code=String(p.N03_007||''),city=String(p.N03_004||''),district=String(p.N03_003||'');
 const ward=String(p.N03_005||'');
 const name=ward?city+ward:/[町村]$/.test(city)&&district?district+city:city;
 if(!city.trim()||ward&&!city.trim())throw Error('Missing N03 municipality name for '+code);
 if(!/^[0-9]{5}$/.test(code)||!name||!geometryValid(f.geometry))throw Error('Invalid N03 feature');
 if(names.has(code)&&names.get(code)!==name)throw Error('Conflicting municipality name for '+code);
 names.set(code,name);
 rows.push([code,name,JSON.stringify(f.geometry),year,url].map(quote).join(','));
}
if(rows.length<2)throw Error('No polygons');
if(require('node:path').resolve(input)===require('node:path').resolve(output))throw Error('Input and output must differ');
const temporary=output+'.tmp-'+process.pid;
try{fs.writeFileSync(temporary,rows.join('\n')+'\n',{flag:'wx'});fs.renameSync(temporary,output)}finally{if(fs.existsSync(temporary))fs.unlinkSync(temporary)}
const checksum=crypto.createHash('sha256').update(fs.readFileSync(input)).digest('hex');
console.log(JSON.stringify({polygons:rows.length-1,municipalities:names.size,source_year:Number(year),source_url:url,input_sha256:checksum,output}));
