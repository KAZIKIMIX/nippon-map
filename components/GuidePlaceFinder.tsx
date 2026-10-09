"use client";
import {useMemo,useState} from "react";
import type {GuidePlace} from "../lib/guide-categories";
import {safeOfficialUrl} from "../lib/guide-categories";
import styles from "./GuidePlaceFinder.module.css";
type Props={places:GuidePlace[];category:string;prefecture:string};
export default function GuidePlaceFinder({places,category,prefecture}:Props){
 const [city,setCity]=useState("");
 const [visibleLimit,setVisibleLimit]=useState(40);
 const [query,setQuery]=useState("");
 const [sort,setSort]=useState<"name"|"city">("name");
 const handleSortChange=(value:string)=>setSort(value==="city"?"city":"name");
 const cities=useMemo(()=>[...new Set(places.map(p=>p.municipality_name).filter((name):name is string=>Boolean(name)))].sort((a,b)=>a.localeCompare(b,"ja")),[places]);
 const filtered=useMemo(()=>places.filter(p=>(!city||p.municipality_name===city)&&(!query.trim()||[p.name,p.address,p.municipality_name].some(v=>(v||"").normalize("NFKC").toLocaleLowerCase("ja").includes(query.trim().normalize("NFKC").toLocaleLowerCase("ja"))))).sort((a,b)=>sort==="city"?(a.municipality_name||"").localeCompare(b.municipality_name||"","ja")||a.name.localeCompare(b.name,"ja"):a.name.localeCompare(b.name,"ja")),[places,city,query,sort]);
 const reset=()=>{setCity("");setQuery("");setSort("name");setVisibleLimit(40)};
 return <section className={styles.finder} aria-label="施設の絞り込み">
 <div className={styles.controls}><label>施設名・住所で検索<input type="search" placeholder="施設名・住所を入力" value={query} onChange={e=>{setQuery(e.target.value);setVisibleLimit(40)}} aria-controls="guide-results"/></label><label>市区町村<select value={city} onChange={e=>{setCity(e.target.value);setVisibleLimit(40)}} aria-controls="guide-results"><option value="">すべての市区町村</option>{cities.map(name=><option key={name} value={name}>{name}</option>)}</select></label><label>並び順<select value={sort} onChange={e=>{handleSortChange(e.target.value);setVisibleLimit(40)}} aria-controls="guide-results"><option value="name">施設名順</option><option value="city">市区町村順</option></select></label><button type="button" onClick={reset}>条件をクリア</button></div>
 <div className={styles.summary} role="status" aria-live="polite" aria-atomic="true"><strong>{filtered.length.toLocaleString()}</strong> 件表示 / {places.length.toLocaleString()} 件掲載 <a href={"/map?"+new URLSearchParams({category,prefecture}).toString()}>この地域を地図で見る →</a></div>
 {filtered.length?<ul id="guide-results" className={styles.results}>{filtered.slice(0,visibleLimit).map(p=>{const params=new URLSearchParams({category,prefecture,place:String(p.id)});const official=safeOfficialUrl(p.official_url);return <li key={p.id}><h3><a href={"/map?"+params.toString()}>{p.name} <span aria-hidden="true">↗</span></a></h3><p>{p.address||[p.prefecture_name,p.municipality_name].filter(Boolean).join(" ")}{!p.address&&"（住所未登録・地図上の位置を確認）"}</p><div className={styles.links}><a href={"/map?"+params.toString()}>地図で確認 →</a>{official&&<a href={official} target="_blank" rel="noopener noreferrer">公式サイト ↗</a>}</div></li>})}</ul>:<div id="guide-results" className={styles.empty}><strong>該当する施設はありません</strong><p>検索語や市区町村を変更してお試しください。</p><button type="button" onClick={reset}>すべての施設を表示</button></div>}
 {filtered.length>visibleLimit&&<button className={styles.loadMore} type="button" onClick={()=>setVisibleLimit(n=>n+40)}>さらに40件表示（残り{filtered.length-visibleLimit}件）</button>}
 </section>;
}
