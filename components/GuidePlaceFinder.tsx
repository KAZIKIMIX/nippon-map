"use client";
import {useMemo,useState} from "react";
import type {GuidePlace} from "../lib/guide-categories";
import {safeOfficialUrl} from "../lib/guide-categories";
import styles from "./GuidePlaceFinder.module.css";
type Props={places:GuidePlace[];category:string;prefecture:string};
export default function GuidePlaceFinder({places,category,prefecture}:Props){
 const [city,setCity]=useState("");
 const [query,setQuery]=useState("");
 const [sort,setSort]=useState<"name"|"city">("name");
 const cities=useMemo(()=>[...new Set(places.map(p=>p.municipality_name).filter(Boolean))].sort((a,b)=>a.localeCompare(b,"ja")),[places]);
 const filtered=useMemo(()=>places.filter(p=>(!city||p.municipality_name===city)&&(!query.trim()||[p.name,p.address,p.municipality_name].some(v=>(v||"").normalize("NFKC").toLocaleLowerCase("ja").includes(query.trim().normalize("NFKC").toLocaleLowerCase("ja"))))).sort((a,b)=>sort==="city"?(a.municipality_name||"").localeCompare(b.municipality_name||"","ja")||a.name.localeCompare(b.name,"ja"):a.name.localeCompare(b.name,"ja")),[places,city,query,sort]);
 const reset=()=>{setCity("");setQuery("");setSort("name")};
 return <section className={styles.finder} aria-label="施設の絞り込み">
 <div className={styles.controls}><label>施設名・住所で検索<input type="search" placeholder="例：公園・駅・施設名" value={query} onChange={e=>setQuery(e.target.value)}/></label><label>市区町村<select value={city} onChange={e=>setCity(e.target.value)}><option value="">すべての市区町村</option>{cities.map(name=><option key={name} value={name}>{name}</option>)}</select></label><label>並び順<select value={sort} onChange={e=>setSort(e.target.value)}><option value="name">施設名順</option><option value="city">市区町村順</option></select></label><button type="button" onClick={reset}>条件をクリア</button></div>
 <div className={styles.summary} role="status"><strong>{filtered.length.toLocaleString()}</strong> 件表示 / {places.length.toLocaleString()} 件掲載 <a href={"/map?"+new URLSearchParams({category,prefecture}).toString()}>この地域を地図で見る →</a></div>
 {filtered.length?<ul className={styles.results}>{filtered.map(p=>{const params=new URLSearchParams({category,prefecture,place:String(p.id)});const official=safeOfficialUrl(p.official_url);return <li key={p.id}><h3><a href={"/map?"+params.toString()}>{p.name} <span aria-hidden="true">↗</span></a></h3><p>{p.address||[p.prefecture_name,p.municipality_name].filter(Boolean).join(" ")}</p><div className={styles.links}><a href={"/map?"+params.toString()}>地図で確認 →</a>{official&&<a href={official} target="_blank" rel="noopener noreferrer">公式サイト ↗</a>}</div></li>})}</ul>:<div className={styles.empty}><strong>該当する施設はありません</strong><p>検索語や市区町村を変更してお試しください。</p><button type="button" onClick={reset}>すべての施設を表示</button></div>}
 </section>;
}
