export const dynamic="force-dynamic";
import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {guideCategories,isGuideCategory,prefectureOrder,safeOfficialUrl} from "../../../../lib/guide-categories";
import {getGuidePlaces} from "../../../../lib/guide-data";
import styles from "../../[category]/guide.module.css";
import GuidePageView from "../../../../components/GuidePageView";
import GuidePlaceFinder from "../../../../components/GuidePlaceFinder";
type Props={params:Promise<{category:string;prefecture:string}>};
async function resolve(params:Props["params"]){
 const {category,prefecture}=await params;
 const name=decodeURIComponent(prefecture);
 if(!isGuideCategory(category)||!prefectureOrder.includes(name))notFound();
 const places=await getGuidePlaces(category,name);
 if(!places.length)notFound();
 return {category,name,places,guide:guideCategories[category]};
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {category,name,places,guide}=await resolve(params);
 const title=name+"の"+guide.name+"一覧（掲載"+places.length+"件）｜にっぽんマップ";
 const description=name+"の"+guide.name+"一覧を"+places.length+"件掲載。施設名・市区町村で絞り込み、住所・公式サイト・地図を確認できます。お出かけ先やドライブの立ち寄り先探しに。";
 return {title,description,alternates:{canonical:"/guides/"+category+"/"+encodeURIComponent(name)},robots:{index:true,follow:true},openGraph:{title,description,url:"/guides/"+category+"/"+encodeURIComponent(name),type:"website"},twitter:{card:"summary",title,description}};
}
export default async function PrefectureGuide({params}:Props){
 const {category,name,places,guide}=await resolve(params);
 const mapQuery=new URLSearchParams({category,prefecture:name});
 const siblingRegions=(await getGuidePlaces(category)).reduce((acc,place)=>{if(place.prefecture_name&&place.prefecture_name!==name)acc.set(place.prefecture_name,(acc.get(place.prefecture_name)||0)+1);return acc;},new Map<string,number>());
 const nearbyRegions=[...siblingRegions].sort((a,b)=>b[1]-a[1]).slice(0,6);
 const relatedCategories=await Promise.all((Object.keys(guideCategories) as (keyof typeof guideCategories)[]).filter(other=>other!==category).map(async other=>({category:other,count:(await getGuidePlaces(other,name)).length})));
 const missingAddresses=places.filter(place=>!place.address?.trim()).length;
 const missingOfficialUrls=places.filter(place=>!safeOfficialUrl(place.official_url)).length;
 const base="https://nippon-map.vercel.app";
 const pageUrl=base+"/guides/"+category+"/"+encodeURIComponent(name);
 const structuredData={"@context":"https://schema.org","@graph":[{"@type":"CollectionPage","@id":pageUrl+"#webpage",name:name+"の"+guide.name+"一覧",url:pageUrl,inLanguage:"ja",description:name+"の"+guide.name+"を掲載中。掲載件数："+places.length+"件。"},{"@type":"ItemList",name:name+"の"+guide.name+"掲載施設",numberOfItems:places.length,itemListElement:places.map((place,index)=>({"@type":"ListItem",position:index+1,name:place.name,url:base+"/map?"+new URLSearchParams({category,prefecture:name,place:String(place.id)}).toString()}))},{"@type":"BreadcrumbList",itemListElement:[{"@type":"ListItem",position:1,name:"トップ",item:base+"/"},{"@type":"ListItem",position:2,name:guide.name+"のガイド",item:base+"/guides/"+category},{"@type":"ListItem",position:3,name:name,item:pageUrl}]}]};
 return <div className={styles.page}><script type="application/ld+json" dangerouslySetInnerHTML={{__html:JSON.stringify(structuredData).replace(/</g,"\\u003c")}}/>
 <GuidePageView category={category}/>
 <header className={styles.header}><a className={styles.brand} href="/"><img src="/brand-mark.webp" width={36} height={36} alt=""/><strong>にっぽんマップ</strong></a><a href={"/map?"+mapQuery.toString()}>地図を開く ↗</a></header>
 <main className={styles.main}>
 <nav className={styles.breadcrumb} aria-label="パンくず"><a href="/">トップ</a> / <a href={"/guides/"+category}>{guide.name}のガイド</a> / <span>{name}</span></nav>
 <section className={styles.intro}><div><p className={styles.eyebrow}>都道府県別ガイド</p><h1>{name}の{guide.name}一覧</h1><p>{name}で掲載中の{guide.name}を一覧から探せます。掲載件数は{places.length.toLocaleString()}件です。施設名・市区町村で絞り込み、住所・公式サイトを確認してから地図を開けます。</p><a className={styles.primary} href={"/map?"+mapQuery.toString()}>{name}の{guide.name}を地図で見る ↗</a></div><img src={"/category-assets/"+category+".webp"} width={128} height={128} alt=""/></section>
 <section className={styles.directory}><h2>掲載施設（{places.length.toLocaleString()}件）</h2><p>データ登録状況：住所登録済み {(places.length-missingAddresses).toLocaleString()}件 / 公式サイトURL登録済み {(places.length-missingOfficialUrls).toLocaleString()}件。未登録項目は地図上の位置や施設の公式情報で確認してください。</p><GuidePlaceFinder places={places} category={category} prefecture={name}/></section>
 <section className={styles.tips}><h2>{name}の{guide.name}の探し方</h2><ol><li>施設名や市区町村が分かる場合は、掲載施設の検索欄で絞り込みます。</li><li>施設ごとの住所と公式サイトを確認し、営業日や利用条件を調べます。</li><li>「地図で確認」から場所を開き、周辺の位置関係を確認できます。</li></ol></section>
 <section className={styles.tips}><h2>訪問前に確認したいこと</h2><ul>{guide.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></section>
 <p className={styles.note}>掲載範囲と情報の更新時点は施設ごとに異なります。営業状況や利用条件は各施設の公式情報でご確認ください。</p>
 <nav aria-label="関連する地域とガイド"><h2>同じカテゴリのほかの地域</h2><ul>{nearbyRegions.map(([region,count])=><li key={region}><a href={"/guides/"+category+"/"+encodeURIComponent(region)}>{region}の{guide.name}一覧（{count.toLocaleString()}件） →</a></li>)}</ul><p><a href={"/guides/"+category}>← {guide.name}の都道府県一覧に戻る</a></p>{relatedCategories.some(other=>other.count>0)&&<><h2>{name}のほかのお出かけ先</h2><ul>{relatedCategories.filter(other=>other.count>0).map(other=><li key={other.category}><a href={"/guides/"+other.category+"/"+encodeURIComponent(name)}>{name}の{guideCategories[other.category].name}一覧（{other.count.toLocaleString()}件） →</a></li>)}</ul></>}</nav>
 </main><footer className={styles.footer}><a href="/">にっぽんマップ</a></footer></div>;
}

