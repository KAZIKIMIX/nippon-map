export const dynamic="force-dynamic";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {guideCategories,isGuideCategory,groupGuidePlaces,safeOfficialUrl} from "../../../lib/guide-categories";
import {getGuidePlaces} from "../../../lib/guide-data";
import GuidePageView from "../../../components/GuidePageView";
import PrefectureMap from "../../../components/PrefectureMap";
import styles from "./guide.module.css";
type Props={params:Promise<{category:string}>};
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {category}=await params;if(!isGuideCategory(category))return {};
 const guide=guideCategories[category];
 return {title:guide.name+"の地域別一覧と地図｜にっぽんマップ",description:guide.intro,alternates:{canonical:"/guides/"+category},robots:{index:true,follow:true},openGraph:{title:guide.name+"を地域から探す｜にっぽんマップ",description:guide.intro,url:"/guides/"+category,images:[{url:"/social/launch-20261009.png",width:1200,height:630}]},twitter:{card:"summary_large_image",title:guide.name+"を地域から探す｜にっぽんマップ",description:guide.intro,images:["/social/launch-20261009.png"]}};
}
export default async function GuidePage({params}:Props){
 const {category}=await params;if(!isGuideCategory(category))notFound();
 const guide=guideCategories[category],places=await getGuidePlaces(category),groups=groupGuidePlaces(places);
 const limit=4;
 const structuredData={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","@id":"https://nippon-map.vercel.app/guides/"+category+"#webpage",name:guide.title,description:guide.intro,url:"https://nippon-map.vercel.app/guides/"+category,inLanguage:"ja",isPartOf:{"@type":"WebSite",name:"にっぽんマップ",url:"https://nippon-map.vercel.app/"}},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"トップ",item:"https://nippon-map.vercel.app/"},{"@type":"ListItem",position:2,name:guide.name+"のガイド",item:"https://nippon-map.vercel.app/guides/"+category}]}]};
 return <div className={styles.page}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/><GuidePageView category={category}/>
 <header className={styles.header}><a className={styles.brand} href="/"><img src="/brand-mark.webp" width={36} height={36} alt=""/><strong>にっぽんマップ</strong><small>BETA</small></a><a href={"/map?category="+category}>地図を開く ↗</a></header>
 <main className={styles.main}>
 <nav className={styles.breadcrumb} aria-label="パンくず"><a href="/">トップ</a><span aria-hidden="true"> / </span><span>{guide.name}のガイド</span></nav>
 <section className={styles.intro}><div><p className={styles.eyebrow}>地域別ガイド</p><h1>{guide.title}</h1><p>{guide.intro}</p><a className={styles.primary} href={"/map?category="+category}>{guide.name}を地図で見る <span aria-hidden="true">↗</span></a></div><img src={"/category-assets/"+category+".webp"} width={128} height={128} alt=""/></section>
 <div className={styles.stats}><p>掲載中 <strong>{places.length.toLocaleString()}</strong> 件</p><p>掲載地域 <strong>{groups.length}</strong> 都道府県</p><span>本サイトの掲載件数です。全施設の網羅を保証するものではありません。</span></div>
 <section className={styles.directory} aria-labelledby="regions-title"><h2 id="regions-title">都道府県から探す</h2><p>地域を開くと、掲載施設の{"例（最大4件）"}を確認できます。</p><PrefectureMap category={category} counts={Object.fromEntries(groups.map(group=>[group.prefecture,group.places.length]))}/>
 <div className={styles.regions}>{groups.map((group,index)=><details key={group.prefecture} id={"pref-"+group.prefecture} open={index===0}><summary><span>{group.prefecture}</span><span>{group.places.length.toLocaleString()}件 <span aria-hidden="true">＋</span></span></summary><p><a href={"/guides/"+category+"/"+encodeURIComponent(group.prefecture)}>{group.prefecture}の{guide.name}一覧ページを見る →</a></p><ul>{group.places.slice(0,limit).map(place=>{
 const official=safeOfficialUrl(place.official_url);
 const query=new URLSearchParams({category,prefecture:group.prefecture,place:String(place.id)});
 return <li key={place.id}><h3><a href={"/map?"+query.toString()}>{place.name} <span aria-hidden="true">↗</span></a></h3><p>{place.address||[place.prefecture_name,place.municipality_name].filter(Boolean).join(" ")}</p>{official&&<a className={styles.official} href={official} target="_blank" rel="noreferrer">公式サイトを見る ↗</a>}</li>;
 })}</ul><a className={styles.regionMap} href={"/map?"+new URLSearchParams({category,prefecture:group.prefecture}).toString()}>{group.prefecture}の{guide.name}を地図で見る（{group.places.length.toLocaleString()}件） →</a></details>)}</div>
 </section>
 <section className={styles.tips}><p className={styles.eyebrow}>出かける前に</p><h2>公式情報を確認して、予定を立てよう。</h2><ul>{guide.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></section>
 <section className={styles.related}><h2>ほかの寄り道も探す</h2><div>{Object.entries(guideCategories).filter(([slug])=>slug!==category).map(([slug,item])=><a key={slug} href={"/guides/"+slug}><img src={"/category-assets/"+slug+".webp"} width={44} height={44} alt=""/>{item.name}のガイド <span aria-hidden="true">→</span></a>)}</div><a href="/#categories">すべてのカテゴリを見る →</a></section>
 <p className={styles.note}>本ページは、にっぽんマップで公開中の掲載データをもとに表示しています。名称・所在地・営業状況などが変更されている場合があります。最新情報は施設の公式サイトでご確認ください。地図ページでは施設の詳細を確認できます。掲載一覧は最大10分程度、更新の反映が遅れる場合があります。</p>
 </main><footer className={styles.footer}><a href="/">にっぽんマップ</a><a href="/privacy">プライバシー・利用計測の設定</a></footer></div>;
}
