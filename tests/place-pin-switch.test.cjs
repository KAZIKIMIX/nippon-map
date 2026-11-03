const {test}=require("node:test");
const assert=require("node:assert/strict");
const fs=require("node:fs");
const ts=require("typescript");
const compile=(source)=>ts.transpileModule(source,{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText;
function helpers(){
 const exports={};
 new Function("exports",compile(fs.readFileSync("lib/place-pin-filter.ts","utf8")))(exports);
 return exports;
}
function accepts(filter,properties){
 const value=e=>{
  if(!Array.isArray(e))return e;
  switch(e[0]){
   case "literal":return e[1];
   case "get":return properties[e[1]];
   case "has":return Object.hasOwn(properties,e[1]);
   case "!":return !value(e[1]);
   case "all":return e.slice(1).every(value);
   case "in":return value(e[2]).includes(value(e[1]));
   default:throw Error("unsupported filter "+e[0]);
  }
 };
 return value(filter);
}
function update({cat="roadside-station",multiCats=[],normalizedQ="",sortByDistance=false,nearbyLocation=null,rows=[]}={}){
 const code=fs.readFileSync("components/MapApp.tsx","utf8");
 const ast=ts.createSourceFile("MapApp.tsx",code,ts.ScriptTarget.Latest,true,ts.ScriptKind.TSX);
 let effect;
 function visit(node){
  if(ts.isCallExpression(node)&&node.expression.getText(ast)==="useEffect"&&node.arguments[0]?.getText(ast).includes('src.setData('))effect=node.arguments[0].getText(ast);
  ts.forEachChild(node,visit);
 }
 visit(ast);assert.ok(effect,"actual MapApp source update effect");
 const state={filter:["!",["has","point_count"]],data:null,order:[]};
 const m={getSource:()=>({setData:data=>{state.order.push("data");state.data=data;}}),setFilter:(id,filter)=>{assert.equal(id,"unclustered");state.order.push("filter");state.filter=filter;},on(){},off(){}};
 const args={map:{current:m},cat,multiCats,normalizedQ,sortByDistance,nearbyLocation,shown:rows,searchRows:rows,dropPins(){},...helpers()};
 const exports={};
 new Function(...Object.keys(args),"exports",compile("exports.run = "+effect))(...Object.values(args),exports);
 exports.run();return state;
}
const fish={id:1,category_slug:"aquarium",longitude:139.7,latitude:35.6};
const road={id:2,category_slug:"roadside-station",longitude:139.8,latitude:35.7};
test("switch blocks old fish in the render filter before async source replacement",()=>{
 const state=update({rows:[road]});
 assert.equal(accepts(state.filter,{id:1,category:"aquarium"}),false);
 assert.equal(accepts(state.filter,{id:2,category:"roadside-station"}),true);
 assert.equal(state.order[0],"filter");
});
test("stale or mixed rows cannot reinsert a category outside single selection",()=>{
 const state=update({rows:[fish,road]});
 assert.deepEqual(state.data.features.map(f=>f.properties.id),[2]);
});
test("rapid reverse switching uses the latest selection",()=>{
 const state=update({cat:"aquarium",rows:[fish,road]});
 assert.equal(accepts(state.filter,{category:"roadside-station"}),false);
 assert.deepEqual(state.data.features.map(f=>f.properties.id),[1]);
});
test("multi-category and nationwide text search retain their existing scopes",()=>{
 const multi=update({multiCats:["aquarium","roadside-station"],rows:[fish,road]});
 assert.deepEqual(multi.data.features.map(f=>f.properties.id),[1,2]);
 const global=update({normalizedQ:"品川",rows:[fish,road]});
 assert.deepEqual(global.data.features.map(f=>f.properties.id),[1,2]);
 assert.equal(accepts(global.filter,{point_count:5}),false);
 const nearby=update({normalizedQ:"品川",sortByDistance:true,nearbyLocation:{},rows:[fish,road]});
 assert.deepEqual(nearby.data.features.map(f=>f.properties.id),[2]);
});
test("no category selected clears pins and invalid coordinates are excluded",()=>{
 assert.equal(update({cat:null,rows:[fish]}).data.features.length,0);
 assert.equal(update({rows:[{...road,latitude:NaN}]}).data.features.length,0);
});
