"use client";
import {useCallback,useEffect,useMemo,useState} from "react";
import styles from "./PrefectureMap.module.css";
import {prefectureOrder} from "../lib/guide-categories";
type Geometry={type:"Polygon"|"MultiPolygon";coordinates:number[][][]|number[][][][]};
type Feature={properties:{name:string};geometry:Geometry};
type Collection={features:Feature[]};
const source="/data/prefectures.geojson";
function project(point:number[]){const [lon,lat]=point;return [(lon-122)*17.3,(46-lat)*25.5];}
function draw(geometry:Geometry){const polygons=geometry.type==="Polygon"?[geometry.coordinates as number[][][]]:geometry.coordinates as number[][][][];
 return polygons.map(poly=>poly.map(ring=>ring.map((p,i)=>{const [x,y]=project(p);return (i?"L":"M")+x.toFixed(1)+","+y.toFixed(1)}).join(" ")+"Z").join(" ")).join(" ");
}
export default function PrefectureMap({category,counts}:{category:string;counts:Record<string,number>}){
 const [features,setFeatures]=useState<Feature[]>([]);
 const [error,setError]=useState(false);
 const [retry,setRetry]=useState(0);
 const [focused,setFocused]=useState<string|null>(null);
 const [active,setActive]=useState<string|null>(null);
 const [region,setRegion]=useState<"all"|"east"|"west"|"south">("all");
 const [query,setQuery]=useState("");
 const regions=useMemo(()=>({all:prefectureOrder,east:prefectureOrder.slice(0,23),west:prefectureOrder.slice(23,39),south:prefectureOrder.slice(39)}),[]);
 const regionNames=regions[region];
 const totalRegions=Object.values(counts).filter(n=>n>0).length;
 useEffect(()=>{const controller=new AbortController();setError(false);fetch(source,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error("map unavailable");return r.json() as Promise<Collection>}).then(data=>{if(!Array.isArray(data.features)||data.features.length!==47||new Set(data.features.map(f=>f.properties.name)).size!==47||data.features.some(f=>!prefectureOrder.includes(f.properties.name)||!["Polygon","MultiPolygon"].includes(f.geometry.type)))throw Error("invalid map data");if(!controller.signal.aborted)setFeatures(data.features)}).catch(()=>{if(!controller.signal.aborted){setFeatures([]);setError(true)}});return()=>controller.abort()},[retry]);
 const shapes=useMemo(()=>features.map(f=>({name:f.properties.name,path:draw(f.geometry),geometry:f.geometry})),[features]);
 const viewBox=useMemo(()=>{const matching=region==="all"?shapes:shapes.filter(f=>regionNames.includes(f.name));const coords:number[][]=[];for(const f of matching){const polygons=f.geometry.type==="Polygon"?[f.geometry.coordinates as number[][][]]:f.geometry.coordinates as number[][][][];for(const poly of polygons)for(const ring of poly)for(const point of ring)coords.push(project(point));}if(!coords.length)return "0 0 460 600";const xs=coords.map(p=>p[0]),ys=coords.map(p=>p[1]);const minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);const pad=region==="all"?16:20;return [minX-pad,minY-pad,Math.max(120,maxX-minX+pad*2),Math.max(120,maxY-minY+pad*2)].join(" ");},[shapes,region,regionNames]);
 const normalizedQuery=query.trim().normalize("NFKC");
 const regionShapes=region==="all"?shapes:shapes.filter(shape=>regionNames.includes(shape.name));
 const activeRegionNames=regionNames.filter(name=>(counts[name]||0)>0);
 const activeRegionCount=activeRegionNames.reduce((sum,name)=>sum+(counts[name]||0),0);
 const visiblePrefectures=(normalizedQuery?prefectureOrder:regionNames).filter(name=>name.normalize("NFKC").includes(normalizedQuery));
 const selected=(focused||active)&&regionNames.includes(focused||active||"")?(focused||active):null;
 const selectedCount=selected?(counts[selected]||0):0;
 const focusRegion=useCallback((name:string)=>{setFocused(name);setActive(name)},[]);
 const reset=()=>{setRegion("all");setActive(null);setFocused(null);setQuery("")};
 return <section className={styles.wrap} aria-label="日本地図から都道府県を選ぶ">
 <div className={styles.heading}><div><h3>日本地図から地域を選ぶ</h3><p>都道府県をクリック・タップすると施設一覧へ移動します。小さい地域は下の一覧からも選べます。</p></div><div className={styles.selection} aria-live="polite">{selected?selected+" · "+selectedCount+"件":"掲載中 "+totalRegions+"都道府県"}</div></div>
 <div className={styles.legend}><span className={styles.legendAvailable}/>掲載あり <span className={styles.legendUnavailable}/>掲載なし <span className={styles.legendHint}>色のついた都道府県を選択できます</span></div>
 <div className={styles.zoomControls} role="group" aria-label="地図の表示範囲">{([{key:"all",label:"日本全体"},{key:"east",label:"北海道〜長野"},{key:"west",label:"岐阜〜高知"},{key:"south",label:"九州・沖縄"}] as const).map(item=><button key={item.key} type="button" className={region===item.key?styles.zoomActive:undefined} aria-pressed={region===item.key} onClick={()=>{setRegion(item.key);setActive(null);setFocused(null);setQuery("")}}>{item.label}</button>)}<button type="button" className={styles.resetButton} onClick={reset}>リセット ↺</button></div>
 <p className={styles.regionSummary} aria-live="polite">{region==="all"?"日本全体":region==="east"?"北海道〜長野":region==="west"?"岐阜〜高知":"九州・沖縄"}：掲載 {activeRegionNames.length} 都道府県・{activeRegionCount.toLocaleString()} 件</p>
 {shapes.length?<div className={styles.mapScroll}><svg viewBox={viewBox} role="group" aria-label="都道府県を選択できる日本地図。南西諸島も表示しています">{regionShapes.map(({name,path})=><a key={name} href={counts[name]?"/guides/"+category+"/"+encodeURIComponent(name):undefined} aria-label={name+" 掲載"+(counts[name]||0)+"件"} onMouseEnter={()=>setActive(name)} onMouseLeave={()=>setActive(null)} onFocus={()=>focusRegion(name)} onBlur={()=>{setActive(null);setFocused(null)}} className={counts[name]?(selected===name?styles.active:styles.enabled):styles.disabled} tabIndex={counts[name]?0:-1} aria-disabled={!counts[name]}><path d={path} fillRule="evenodd" vectorEffect="non-scaling-stroke"/><title>{name}：{counts[name]||0}件</title></a>)}</svg></div>:<div className={styles.status} role="status"><p>{error?"地図を読み込めませんでした。下の地域一覧から選択できます。":"日本地図を読み込んでいます…"}</p>{error&&<button type="button" onClick={()=>setRetry(n=>n+1)}>地図を再読み込み</button>}</div>}
 {selected&&selectedCount>0&&<div className={styles.selectedPanel}><div><strong>{selected}</strong><span>掲載 {selectedCount.toLocaleString()} 件</span></div><a href={"/guides/"+category+"/"+encodeURIComponent(selected)}>この都道府県の施設を見る →</a></div>}
 <div className={styles.quickPick}><div className={styles.quickHeading}><div><h4>都道府県を直接選ぶ</h4><p>地図上で選びにくい地域はこちらから。</p></div><label><span className={styles.srOnly}>都道府県名で絞り込む</span><input type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="例：東京・神奈川・大阪" list={"prefecture-suggestions-"+category} autoComplete="off" /><datalist id={"prefecture-suggestions-"+category}>{prefectureOrder.filter(name=>(counts[name]||0)>0).map(name=><option key={name} value={name}/>)}</datalist></label></div><div className={styles.prefGrid}>{visiblePrefectures.map(name=>(counts[name]||0)>0?<a key={name} href={"/guides/"+category+"/"+encodeURIComponent(name)} onMouseEnter={()=>setActive(name)} onFocus={()=>focusRegion(name)} onMouseLeave={()=>setActive(null)} onBlur={()=>{setActive(null);setFocused(null)}}>{name}<span>{counts[name]}件 →</span></a>:<span key={name} className={styles.noCoverage}>{name}<small>掲載なし</small></span>)}</div>{visiblePrefectures.length===0&&<p className={styles.noMatches}>該当する都道府県はありません。</p>}</div>
 <p className={styles.credit}>地図境界データ：<a href="https://github.com/kyodo-official/japan-choropleth" target="_blank" rel="noopener noreferrer">共同通信 japan-choropleth</a>を簡略化して使用。原データ：国土交通省「国土数値情報 行政区域データ 2025年版」（CC BY 4.0）。掲載のない地域は選択できません。</p>
 </section>;
}
