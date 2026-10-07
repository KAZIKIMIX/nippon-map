"use client";
import {useEffect,useMemo,useRef,useState} from "react";
import maplibregl,{GeoJSONSource,Map as MapLibreMap} from "maplibre-gl";

type Place={id:number;name:string;category_slug:string;category_name:string;prefecture_name:string;municipality_name:string;address:string;longitude:number;latitude:number};
type FeatureCollection={type:"FeatureCollection";features:Array<{type:"Feature";geometry:{type:"Point";coordinates:[number,number]};properties:{id:number}}>} ;
const cats=[{slug:"airport",name:"空港"},{slug:"roadside-station",name:"道の駅"},{slug:"aquarium",name:"水族館"},{slug:"shelter",name:"避難場所"}];

export default function MapApp(){
 const node=useRef<HTMLDivElement>(null);
 const mapRef=useRef<MapLibreMap|null>(null);
 const indexRef=useRef(new Map<number,Place>());
 const [places,setPlaces]=useState<Place[]>([]);
 const [cat,setCat]=useState("airport");
 const [selected,setSelected]=useState<Place|null>(null);
 const [q,setQ]=useState("");
 const [loaded,setLoaded]=useState(false);

 useEffect(()=>{let active=true;setLoaded(false);fetch(`/api/places?category=${encodeURIComponent(cat)}`).then(r=>r.json()).then(d=>{if(active){setPlaces(d.places??[]);setLoaded(true)}}).catch(()=>active&&setLoaded(true));return()=>{active=false}},[cat]);
 useEffect(()=>{indexRef.current=new Map(places.map(p=>[p.id,p]));},[places]);
 const shown=useMemo(()=>places.filter(p=>!q||`${p.name}${p.prefecture_name}${p.municipality_name}`.includes(q)),[places,q]);
 const ranking=useMemo(()=>Object.entries(shown.reduce<Record<string,number>>((a,p)=>{const n=p.prefecture_name||"地域未設定";a[n]=(a[n]||0)+1;return a;},{})).sort((a,b)=>b[1]-a[1]),[shown]);

 useEffect(()=>{
  if(!node.current||mapRef.current)return;
  const m=new maplibregl.Map({container:node.current,style:"https://tiles.openfreemap.org/styles/liberty",center:[137.5,37.2],zoom:4.2});
  mapRef.current=m;
  m.addControl(new maplibregl.NavigationControl({showCompass:false}),"bottom-right");
  m.on("load",()=>{
   m.addSource("places",{type:"geojson",data:{type:"FeatureCollection",features:[]},cluster:true,clusterMaxZoom:12,clusterRadius:45});
   m.addLayer({id:"clusters",type:"circle",source:"places",filter:["has","point_count"],paint:{"circle-radius":["step",["get","point_count"],18,100,24,1000,30],"circle-color":"#2563eb","circle-opacity":0.86}});
   m.addLayer({id:"cluster-count",type:"symbol",source:"places",filter:["has","point_count"],layout:{"text-field":["get","point_count_abbreviated"],"text-size":12},paint:{"text-color":"#fff"}});
   m.addLayer({id:"unclustered",type:"circle",source:"places",filter:["!",["has","point_count"]],paint:{"circle-radius":6,"circle-color":"#2563eb","circle-stroke-width":2,"circle-stroke-color":"#fff"}});
   m.on("click","clusters",e=>{
    const f=m.queryRenderedFeatures(e.point,{layers:["clusters"]})[0];
    if(!f||f.geometry.type!=="Point")return;
    const source=m.getSource("places");
    if(!source||source.type!=="geojson")return;
    const clusterId=Number(f.properties?.cluster_id);
    source.getClusterExpansionZoom(clusterId).then(zoom=>m.easeTo({center:f.geometry.coordinates as [number,number],zoom}));
   });
   m.on("click","unclustered",e=>{const id=Number(e.features?.[0]?.properties?.id);const p=indexRef.current.get(id);if(p)setSelected(p);});
   for(const id of ["clusters","unclustered"]){m.on("mouseenter",id,()=>{m.getCanvas().style.cursor="pointer"});m.on("mouseleave",id,()=>{m.getCanvas().style.cursor=""});}
  });
  return()=>{m.remove();mapRef.current=null};
 },[]);

 useEffect(()=>{
  const m=mapRef.current;if(!m)return;
  const data:FeatureCollection={type:"FeatureCollection",features:shown.map(p=>({type:"Feature",geometry:{type:"Point",coordinates:[p.longitude,p.latitude]},properties:{id:p.id}}))};
  const update=()=>{const source=m.getSource("places");if(source&&source.type==="geojson")(source as GeoJSONSource).setData(data)};
  if(m.isStyleLoaded())update();else m.once("load",update);
 },[shown]);

 return <main className="shell"><header><div className="brand"><b>N</b><strong>にっぽんマップ</strong><small>BETA</small></div><span>日本の「どこ？」が、一目でわかる。</span></header><div className="workspace"><aside className="left"><p className="eyebrow">EXPLORE JAPAN</p><h1>日本の「どこ？」を<br/>地図で見つけよう。</h1><p className="lead">全国の施設・スポットを、分布から直感的に探せます。</p><div className="search"><span>⌕</span><input value={q} onChange={e=>setQ(e.target.value)} placeholder="施設名・地域で絞り込み"/></div><div className="chips">{cats.map(c=><button className={cat===c.slug?"active":""} onClick={()=>{setCat(c.slug);setSelected(null);setQ("")}} key={c.slug}>{c.name}</button>)}</div><div className="count"><span>掲載データ</span><strong>{loaded?shown.length:"—"}<small>件</small></strong></div><div className="rank"><div><b>都道府県別</b><span>件数</span></div>{ranking.map(([n,count],i)=><button key={n}><span><em>{String(i+1).padStart(2,"0")}</em>{n}</span><b>{count}</b></button>)}</div><p className="note">公開データ・公式情報をもとに掲載しています。データの更新時点はカテゴリごとに異なります。</p></aside><section className="mapbox"><div ref={node} className="map"/><div className="label"><span>{cats.find(c=>c.slug===cat)?.name}</span><b>{loaded?shown.length:"…"} locations</b></div></section><aside className="detail">{selected?<><button className="close" onClick={()=>setSelected(null)}>×</button><div className="visual">{selected.category_name}</div><p className="eyebrow">{selected.category_name}</p><h2>{selected.name}</h2><p>{selected.address}</p><div className="facts"><span>都道府県<b>{selected.prefecture_name||"—"}</b></span><span>市区町村<b>{selected.municipality_name||"—"}</b></span></div><a href={`https://www.google.com/maps/search/?api=1&query=${selected.latitude},${selected.longitude}`} target="_blank" rel="noreferrer">Google Mapsで見る ↗</a></>:<div className="empty"><b>⌖</b><h3>地点を選択</h3><p>地図上のポイントをクリックすると<br/>詳細情報が表示されます。</p></div>}</aside></div></main>;
}
