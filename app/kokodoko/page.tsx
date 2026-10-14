import type {Metadata} from "next";
import CampaignPageView from "../../components/CampaignPageView";
import styles from "../landing.module.css";
export const metadata:Metadata={title:"ここどこchからのお出かけ探し｜にっぽんマップ",description:"ここどこchで見つけた旅先の周辺施設を地図で探す。水族館、動物園、道の駅などを地域別に比較できます。",alternates:{canonical:"/kokodoko"}};
const q="?utm_source=x&utm_medium=social&utm_campaign=kokodoko";
const items=[["aquarium","水族館"],["zoo","動物園"],["roadside-station","道の駅"]];
export default function Kokodoko(){
 return <div className={styles.page}><CampaignPageView/>
 <header className={styles.header}><a className={styles.brand} href="/"><img src="/brand-mark.webp" width={40} height={40} alt=""/><strong>にっぽんマップ</strong></a><a className={styles.headerMap} href={"/map"+q}>地図を開く ↗</a></header>
 <main className={styles.main}>
 <section className={styles.hero}><div className={styles.heroCopy}><p className={styles.eyebrow}>ここどこch × にっぽんマップ</p><h1>気になった旅先の、<br/>次の寄り道を探そう。</h1><p className={styles.intro}>ここどこchで見つけた旅行先。周辺にどんな施設があるか、日本全国の地図で探せます。</p><div className={styles.heroActions}><a className={styles.primary} href={"/map"+q}>全国の地図を開く →</a><a className={styles.secondary} href="#find">ジャンルから探す ↓</a></div></div><div className={styles.heroArt} aria-hidden="true"><span className={styles.heroStamp}>旅の続きは、地図で。</span>{items.map(([slug],i)=><div key={slug} className={styles.artTile+" "+styles["tile"+i]}><img src={"/category-assets/"+slug+".webp"} width={128} height={128} alt=""/></div>)}</div></section>
 <section id="find" className={styles.guides} aria-labelledby="find-title"><div><p className={styles.eyebrow}>TRAVEL & EXPLORE</p><h2 id="find-title">旅先で何を探す？</h2><p>気になるカテゴリを選んで、地域別の施設一覧や地図を見てみよう。</p></div><div className={styles.guideLinks}>{items.map(([slug,name])=><a key={slug} href={"/guides/"+slug+q}><img src={"/category-assets/"+slug+".webp"} width={44} height={44} alt=""/><span>{name}の地域別一覧を見る</span><span aria-hidden="true">→</span></a>)}</div></section>
 <section className={styles.about}><h2>地図で、場所を比較する。</h2><p>都道府県・施設名で絞り込み、複数カテゴリを地図に重ねて表示できます。掲載情報の網羅性は保証していません。営業時間・料金などは公式サイトでご確認ください。</p><a href={"/map"+q}>にっぽんマップを使ってみる →</a></section>
 </main><footer className={styles.footer}><a href="/">にっぽんマップ</a><a href="/privacy">プライバシー・利用計測の設定</a></footer></div>;
}
