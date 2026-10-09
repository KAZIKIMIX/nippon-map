"use client";
import {useEffect,useMemo,useState} from "react";
import styles from "./PrefectureMap.module.css";
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
 const [active,setActive]=useState<string|null>(null);
 const totalRegions=Object.values(counts).filter(n=>n>0).length;
 useEffect(()=>{const controller=new AbortController();fetch(source,{signal:controller.signal}).then(r=>{if(!r.ok)throw Error("map unavailable");return r.json() as Promise<Collection>}).then(data=>setFeatures(data.features)).catch(()=>{if(!controller.signal.aborted)setError(true)});return()=>controller.abort()},[]);
 const shapes=useMemo(()=>features.map(f=>({name:f.properties.name,path:draw(f.geometry)})),[features]);
 return <section className={styles.wrap} aria-label="日本地図から都道府県を選ぶ">
 <div className={styles.heading}><div><h3>日本地図から地域を選ぶ</h3><p>都道府県にカーソルを合わせると拡大します。クリック・タップで掲載施設の一覧へ。</p></div><div className={styles.selection} aria-live="polite">{active?active+" · "+(counts[active]||0)+"件":"掲載中 "+totalRegions+"都道府県"}</div></div>
 <div className={styles.legend}><span className={styles.legendAvailable}/>掲載あり <span className={styles.legendUnavailable}/>掲載なし <span className={styles.legendHint}>色のついた都道府県を選択できます</span></div>
 {shapes.length?<div className={styles.mapScroll}><svg viewBox="0 0 590 700" role="group" aria-label="都道府県を選択できる日本地図。南西諸島も表示しています">{shapes.map(({name,path})=><a key={name} href={counts[name]?"/guides/"+category+"/"+encodeURIComponent(name):undefined} aria-label={name+" 掲載"+(counts[name]||0)+"件"} onMouseEnter={()=>setActive(name)} onMouseLeave={()=>setActive(null)} onFocus={()=>setActive(name)} onBlur={()=>setActive(null)} onTouchStart={()=>setActive(name)} className={counts[name]?(active===name?styles.active:styles.enabled):styles.disabled} tabIndex={counts[name]?0:-1}><path d={path} fillRule="evenodd" vectorEffect="non-scaling-stroke"/><title>{name}：{counts[name]||0}件</title></a>)}</svg></div>:<p className={styles.status}>{error?"地図を読み込めませんでした。下の地域一覧から選択してください。":"日本地図を読み込んでいます…"}</p>}
 <p className={styles.credit}>地図境界データ：<a href="https://github.com/kyodo-official/japan-choropleth" target="_blank" rel="noopener noreferrer">共同通信 japan-choropleth</a>を簡略化して使用。原データ：国土交通省「国土数値情報 行政区域データ 2025年版」（CC BY 4.0）。掲載のない地域は選択できません。</p>
 </section>;
}
