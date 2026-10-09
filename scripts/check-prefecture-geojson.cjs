const fs=require("node:fs");
const assert=require("node:assert/strict");
const file="public/data/prefectures.geojson";
const data=JSON.parse(fs.readFileSync(file,"utf8"));
assert.equal(data.type,"FeatureCollection","Expected GeoJSON FeatureCollection");
assert.equal(data.features.length,47,"Exactly 47 prefectures required");
const names=new Set();
let points=0;
for(const feature of data.features){
 const name=feature.properties?.name;
 assert.ok(typeof name==="string"&&name.length>0,"Prefecture name missing");
 assert.ok(!names.has(name),"Duplicate prefecture: "+name);
 names.add(name);
 const geom=feature.geometry;
 assert.ok(["Polygon","MultiPolygon"].includes(geom.type),"Unexpected geometry for "+name);
 const polygons=geom.type==="Polygon"?[geom.coordinates]:geom.coordinates;
 assert.ok(polygons.length>0,"Missing polygon for "+name);
 for(const polygon of polygons)for(const ring of polygon){
  assert.ok(ring.length>=4,"Invalid ring for "+name);
  assert.deepEqual(ring[0],ring[ring.length-1],"Unclosed polygon ring: "+name);
  for(const p of ring){assert.ok(Array.isArray(p)&&p.length>=2&&Number.isFinite(p[0])&&Number.isFinite(p[1]),"Invalid point: "+name);assert.ok(p[0]>=120&&p[0]<=155&&p[1]>=20&&p[1]<=47,"Unexpected coordinates: "+name);points++;}
 }
}
for(const name of ["北海道","東京都","大阪府","沖縄県"])assert.ok(names.has(name),"Missing "+name);
console.log("GeoJSON integrity OK: "+names.size+" prefectures, "+points+" points");
