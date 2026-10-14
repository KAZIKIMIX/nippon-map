"use client";
import {useEffect,useRef,useState} from "react";
import {mapCategories} from "../lib/map-categories";
import {trackUsage} from "../lib/usage-client";
import styles from "../app/landing.module.css";
const descriptions:Record<string,string>={"botanical-garden":"花と植物に会いに","campsite":"自然の中で過ごす休日","observation-deck":"高い場所から景色を眺める","theme-park":"遊びに出かける一日","factory-tour":"ものづくりの現場を知る","horse-racing":"レースと場内散策を楽しむ","velodrome":"自転車レースの会場を探す","sightseeing":"旅先の名所を見つける",
 aquarium:"水の生きものに会いに",zoo:"動物たちに会いに","roadside-station":"ドライブの寄り道に",airport:"空の旅の入口を探す",shelter:"自治体の避難場所を確認","world-heritage":"日本の文化と自然を巡る","national-park":"自然の風景を探す",railway:"旅の出発駅・到着駅を探す",museum:"アートと学びの寄り道",park:"日常のひと休みに",toilet:"外出先で場所を確認",castle:"歴史を感じる場所へ",lighthouse:"海辺の景色を探す","hot-spring":"温泉地でひと息"
};
export default function CategoryDirectory(){
 const [query,setQuery]=useState("");
 const [showAll,setShowAll]=useState(false);
 const [selectedCategories,setSelectedCategories]=useState<string[]>([]);
 const featured=new Set(["aquarium","zoo","roadside-station","railway","airport","park","hot-spring","castle"]);
 const tracked=useRef(false);
 useEffect(()=>{if(!tracked.current){tracked.current=true;trackUsage("page_view");}},[]);
 const normalized=query.trim().normalize("NFKC").toLowerCase();
 const matches=mapCategories.filter(c=>!normalized||c.name.normalize("NFKC").toLowerCase().includes(normalized)||c.aliases.some(a=>a.normalize("NFKC").toLowerCase().includes(normalized)));
 const shown=normalized||showAll?matches:matches.filter(c=>featured.has(c.slug));
 return <section id="categories" className={styles.categories} aria-labelledby="categories-title">
 <div className={styles.sectionHead}><div><p className={styles.eyebrow}>FIND YOUR NEXT STOP</p><h2 id="categories-title">何を探しますか？</h2><p>複数のカテゴリを選んで、まとめて地図で探せます。</p></div>
 <div className={styles.searchBox}><label htmlFor="category-search">カテゴリを検索</label><div><span aria-hidden="true">⌕</span><input id="category-search" type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="水族館、道の駅、トイレ…" maxLength={100}/></div></div></div>
 {normalized&&<p className={styles.searchStatus} role="status" aria-live="polite">{matches.length}カテゴリが見つかりました</p>}
 <div className={styles.grid}>{shown.map(c=><button type="button" key={c.slug} onClick={()=>setSelectedCategories(prev=>prev.includes(c.slug)?prev.filter(x=>x!==c.slug):[...prev,c.slug])} aria-pressed={selectedCategories.includes(c.slug)} className={styles.categoryCard} style={{textAlign:"left",cursor:"pointer",outline:selectedCategories.includes(c.slug)?"3px solid #2572a5":undefined,outlineOffset:"-3px"}}>
 {c.slug==="library"?<span aria-hidden="true" style={{display:"inline-flex",width:76,height:76,alignItems:"center",justifyContent:"center",borderRadius:20,background:"#e4f3ff",fontSize:48}}>📚</span>:<img src={"/category-assets/"+c.slug+".webp"} width={76} height={76} alt="" loading="lazy"/>}
 <div><h3>{c.name}</h3><p>{descriptions[c.slug]}</p></div><span className={styles.cardArrow} aria-hidden="true">{selectedCategories.includes(c.slug)?"✓":"＋"}</span>
 </button>)}</div>
 {selectedCategories.length>0&&<div style={{display:"flex",gap:12,alignItems:"center",flexWrap:"wrap",margin:"20px 0"}}><a href={"/map?categories="+encodeURIComponent(selectedCategories.join(","))} className={styles.showAllCategories}>{selectedCategories.length}カテゴリを地図で見る →</a><button type="button" className={styles.showAllCategories} onClick={()=>setSelectedCategories([])}>選択解除</button></div>}
 {!normalized&&!showAll&&<button type="button" className={styles.showAllCategories} onClick={()=>setShowAll(true)}>すべてのカテゴリを見る（{mapCategories.length}カテゴリ） <span aria-hidden="true">↓</span></button>}
 {!normalized&&showAll&&<button type="button" className={styles.showAllCategories} onClick={()=>{setShowAll(false);document.getElementById("categories")?.scrollIntoView({behavior:"smooth"})}}>おすすめカテゴリに戻す ↑</button>}
 {shown.length===0&&<div className={styles.noResults}><p>該当するカテゴリはありません。</p><button type="button" onClick={()=>setQuery("")}>すべてのカテゴリを表示</button></div>}
 <p className={styles.coverage}>一部のカテゴリは地域限定・順次追加中です。掲載範囲は地図ページで確認できます。</p>
 </section>;
}

