"use client";
import {useEffect,useRef,useState} from "react";
import {mapCategories} from "../lib/map-categories";
import {trackUsage} from "../lib/usage-client";
import styles from "../app/landing.module.css";
const descriptions:Record<string,string>={
 aquarium:"水の生きものに会いに",zoo:"動物たちに会いに","roadside-station":"ドライブの寄り道に",airport:"空の旅の入口を探す",shelter:"自治体の避難場所を確認","world-heritage":"日本の文化と自然を巡る","national-park":"自然の風景を探す",railway:"旅の出発駅・到着駅を探す",museum:"アートと学びの寄り道",park:"日常のひと休みに",toilet:"外出先で場所を確認",castle:"歴史を感じる場所へ",lighthouse:"海辺の景色を探す","hot-spring":"温泉地でひと息"
};
export default function CategoryDirectory(){
 const [query,setQuery]=useState("");
 const tracked=useRef(false);
 useEffect(()=>{if(!tracked.current){tracked.current=true;trackUsage("page_view");}},[]);
 const normalized=query.trim().normalize("NFKC").toLowerCase();
 const shown=mapCategories.filter(c=>!normalized||c.name.normalize("NFKC").toLowerCase().includes(normalized)||c.aliases.some(a=>a.normalize("NFKC").toLowerCase().includes(normalized)));
 return <section id="categories" className={styles.categories} aria-labelledby="categories-title">
 <div className={styles.sectionHead}><div><p className={styles.eyebrow}>FIND YOUR NEXT STOP</p><h2 id="categories-title">何を探しますか？</h2><p>カテゴリを選ぶと、その地点を地図に表示します。</p></div>
 <div className={styles.searchBox}><label htmlFor="category-search">カテゴリを検索</label><div><span aria-hidden="true">⌕</span><input id="category-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="水族館、道の駅、トイレ…" maxLength={100}/></div></div></div>
 {normalized&&<p className={styles.searchStatus} role="status" aria-live="polite">{shown.length}カテゴリが見つかりました</p>}
 <div className={styles.grid}>{shown.map(c=><a key={c.slug} href={"/map?category="+c.slug} className={styles.categoryCard}>
 <img src={"/category-assets/"+c.slug+".webp"} width={76} height={76} alt="" loading="lazy"/>
 <div><h3>{c.name}</h3><p>{descriptions[c.slug]}</p></div><span className={styles.cardArrow} aria-hidden="true">↗</span>
 </a>)}</div>
 {shown.length===0&&<div className={styles.noResults}><p>該当するカテゴリはありません。</p><button type="button" onClick={()=>setQuery("")}>すべてのカテゴリを表示</button></div>}
 <p className={styles.coverage}>一部のカテゴリは地域限定・順次追加中です。掲載範囲は地図ページで確認できます。</p>
 </section>;
}
