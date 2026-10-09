export const dynamic="force-dynamic";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {guideCategories,isGuideCategory,prefectureOrder} from "../../../../lib/guide-categories";
import {getGuidePlaces} from "../../../../lib/guide-data";
import styles from "../../[category]/guide.module.css";
import GuidePlaceFinder from "../../../../components/GuidePlaceFinder";
type Props={params:Promise<{category:string;prefecture:string}>};
async function resolve(params:Props["params"]){
 const {category,prefecture}=await params;
 const name=prefecture;
 if(!isGuideCategory(category)||!prefectureOrder.includes(name))notFound();
 const places=await getGuidePlaces(category,name);
 if(!places.length)notFound();
 return {category,name,places,guide:guideCategories[category]};
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {category,name,places,guide}=await resolve(params);
 const title=name+"の"+guide.name+"一覧（掲載"+places.length+"件）｜にっぽんマップ";
 const description=name+"の"+guide.name+"を"+places.length+"件掲載。施設名・市区町村で絞り込み、地図上の位置を確認できます。掲載施設の網羅は保証していません。";
 return {title,description,alternates:{canonical:"/guides/"+category+"/"+encodeURIComponent(name)},robots:{index:true,follow:true},openGraph:{title,description,url:"/guides/"+category+"/"+encodeURIComponent(name),type:"website"},twitter:{card:"summary",title,description}};
}
export default async function PrefectureGuide({params}:Props){
 const {category,name,places,guide}=await resolve(params);
 const mapQuery=new URLSearchParams({category,prefecture:name});
 const base="https://nippon-map.vercel.app";
 const pageUrl=base+"/guides/"+category+"/"+encodeURIComponent(name);
 const structuredData={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","@id":pageUrl+"#webpage",name:name+"の"+guide.name+"一覧",url:pageUrl,inLanguage:"ja",description:name+"の"+guide.name+"を掲載中。掲載件数："+places.length+"件。"},{"@type":"ItemList",name:name+"の"+guide.name+"掲載施設",numberOfItems:places.length,itemListElement:places.map((place,index)=>({"@type":"ListItem",position:index+1,name:place.name,url:base+"/map?"+new URLSearchParams({category,prefecture:name,place:String(place.id)}).toString()}))},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"トップ",item:base+"/"},{"@type":"ListItem",position:2,name:guide.name+"のガイド",item:base+"/guides/"+category},{"@type":"ListItem",position:3,name:name,item:pageUrl}]}]};
 return <div className={styles.page}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData)}}/>
 <header className={styles.header}><a className={styles.brand} href="/"><img src="/brand-mark.webp" width={36} height={36} alt=""/><strong>にっぽんマップ</strong></a><a href={"/map?"+mapQuery.toString()}>地図を開く ↗</a></header>
 <main className={styles.main}>
 <nav className={styles.breadcrumb} aria-label="パンくず"><a href="/">トップ</a> / <a href={"/guides/"+category}>{guide.name}のガイド</a> / <span>{name}</span></nav>
 <section className={styles.intro}><div><p className={styles.eyebrow}>都道府県別ガイド</p><h1>{name}の{guide.name}一覧</h1><p>{name}で掲載中の{guide.name}を一覧から探せます。掲載件数は{places.length.toLocaleString()}件です。すべての施設を網羅するものではありません。</p><a className={styles.primary} href={"/map?"+mapQuery.toString()}>{name}の{guide.name}を地図で見る ↗</a></div><img src={"/category-assets/"+category+".webp"} width={128} height={128} alt=""/></section>
 <section className={styles.directory}><h2>掲載施設（{places.length.toLocaleString()}件）</h2><GuidePlaceFinder places={places} category={category} prefecture={name}/></section>
 <section className={styles.tips}><h2>訪問前に確認したいこと</h2><ul>{guide.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></section>
 <p className={styles.note}>掲載範囲と情報の更新時点は施設ごとに異なります。営業状況や利用条件は各施設の公式情報でご確認ください。</p>
 <nav aria-label="関連する地域とガイド"><p><a href={"/guides/"+category}>← {guide.name}の都道府県一覧に戻る</a></p><p>{(Object.keys(guideCategories) as (keyof typeof guideCategories)[]).filter(other=>other!==category).map(other=><a key={other} href={"/guides/"+other} style={{display:"inline-block",marginRight:18,marginBottom:10}}>{guideCategories[other].name}の地域一覧を見る →</a>)}</p></nav>
 </main><footer className={styles.footer}><a href="/">にっぽんマップ</a></footer></div>;
}
