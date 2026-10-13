// Validate N03 GeoJSON and export a CSV suitable for municipality_boundaries_staging.
const fs=require('node:fs');
const [input,output,year,url]=process.argv.slice(2);
if(!input||!output||!/^[0-9]{4}$/.test(year||'')||!/^https:\/\//.test(url||''))throw Error('Usage: node scripts/export-n03.cjs input.geojson output.csv YEAR https://source-url');
const data=JSON.parse(fs.readFileSync(input,'utf8'));
if(data.type!=='FeatureCollection'||!Array.isArray(data.features))throw Error('Expected FeatureCollection');
const quote=v=>'"'+String(v).replace(/"/g,'""')+'"';
const names=new Map(),rows=['municipality_code,municipality_name,geometry_geojson,source_year,source_url'];
for(const f of data.features){
 const p=f.properties||{},code=String(p.N03_007||''),city=String(p.N03_004||''),district=String(p.N03_003||'');
 const name=/[町村]$/.test(city)&&district?district+city:city;
 if(!/^[0-9]{5}$/.test(code)||!name||!['Polygon','MultiPolygon'].includes(f.geometry?.type))throw Error('Invalid N03 feature');
 if(names.has(code)&&names.get(code)!==name)throw Error('Conflicting municipality name for '+code);
 names.set(code,name);
 rows.push([code,name,JSON.stringify(f.geometry),year,url].map(quote).join(','));
}
if(rows.length<2)throw Error('No polygons');
fs.writeFileSync(output,rows.join('\n')+'\n');
console.log('Exported '+(rows.length-1)+' polygons for '+names.size+' municipalities');
