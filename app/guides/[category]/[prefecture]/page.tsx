import type {Metadata} from "next";
import {notFound} from "next/navigation";
import {guideCategories,isGuideCategory,prefectureOrder,safeOfficialUrl} from "../../../../lib/guide-categories";
import {getGuidePlaces} from "../../../../lib/guide-data";
import styles from "../../[category]/guide.module.css";
type Props={params:Promise<{category:string;prefecture:string}>};
async function resolve(params:Props["params"]){
 const {category,prefecture}=await params;
 const name=decodeURIComponent(prefecture);
 if(!isGuideCategory(category)||!prefectureOrder.includes(name))notFound();
 const places=(await getGuidePlaces(category)).filter(p=>p.prefecture_name===name);
 if(!places.length)notFound();
 return {category,name,places,guide:guideCategories[category]};
}
export async function generateMetadata({params}:Props):Promise<Metadata>{
 const {category,name,places,guide}=await resolve(params);
 const title=name+"の"+guide.name+"一覧（掲載"+places.length+"件）｜にっぽんマップ";
 const description=name+"で掲載中の"+guide.name+places.length+"件を一覧で確認。住所や公式サイトを調べ、地図で場所を探せます。掲載施設の網羅を保証するものではありません。";
 return {title,description,alternates:{canonical:"/guides/"+category+"/"+encodeURIComponent(name)},robots:{index:true,follow:true}};
}
export default async function PrefectureGuide({params}:Props){
 const {category,name,places,guide}=await resolve(params);
 const mapQuery=new URLSearchParams({category,prefecture:name});
 return <div className={styles.page}>
 <header className={styles.header}><a className={styles.brand} href="/"><img src="/brand-mark.webp" width={36} height={36} alt=""/><strong>にっぽんマップ</strong></a><a href={"/map?"+mapQuery.toString()}>地図を開く ↗</a></header>
 <main className={styles.main}>
 <nav className={styles.breadcrumb} aria-label="パンくず"><a href="/">トップ</a> / <a href={"/guides/"+category}>{guide.name}のガイド</a> / <span>{name}</span></nav>
 <section className={styles.intro}><div><p className={styles.eyebrow}>都道府県別ガイド</p><h1>{name}の{guide.name}一覧</h1><p>{name}で掲載中の{guide.name}を一覧から探せます。掲載件数は{places.length.toLocaleString()}件です。すべての施設を網羅するものではありません。</p><a className={styles.primary} href={"/map?"+mapQuery.toString()}>{name}の{guide.name}を地図で見る ↗</a></div><img src={"/category-assets/"+category+".webp"} width={128} height={128} alt=""/></section>
 <section className={styles.directory}><h2>掲載施設（{places.length.toLocaleString()}件）</h2><ul>{places.map(p=>{const query=new URLSearchParams({category,prefecture:name,place:String(p.id)});const official=safeOfficialUrl(p.official_url);return <li key={p.id}><h3><a href={"/map?"+query.toString()}>{p.name} ↗</a></h3><p>{p.address||[p.prefecture_name,p.municipality_name].filter(Boolean).join(" ")}</p>{official&&<a href={official} target="_blank" rel="noopener noreferrer">公式サイトを見る ↗</a>}</li>})}</ul></section>
 <section className={styles.tips}><h2>訪問前に確認したいこと</h2><ul>{guide.tips.map(tip=><li key={tip}>{tip}</li>)}</ul></section>
 <p className={styles.note}>掲載範囲と情報の更新時点は施設ごとに異なります。営業状況や利用条件は各施設の公式情報でご確認ください。</p>
 <p><a href={"/guides/"+category}>← {guide.name}の都道府県一覧に戻る</a></p>
 </main><footer className={styles.footer}><a href="/">にっぽんマップ</a></footer></div>;
}
