import {redirect} from "next/navigation";
import CategoryDirectory from "../components/CategoryDirectory";
import {legacyMapPath,type LandingParams} from "../lib/landing-links";
import styles from "./landing.module.css";
export default async function Home({searchParams}:{searchParams:Promise<LandingParams>}) {
 const target=legacyMapPath(await searchParams);
 if(target)redirect(target);
 return <div className={styles.page}>
 <a className={styles.skip} href="#categories">カテゴリ選択へ</a>
 <header className={styles.header}>
 <a className={styles.brand} href="/" aria-label="にっぽんマップ トップページ"><img src="/brand-mark.webp" width={40} height={40} alt=""/><strong>にっぽんマップ</strong><small>BETA</small></a>
 <a className={styles.headerMap} href="/map">地図を開く <span aria-hidden="true">↗</span></a>
 </header>
 <main className={styles.main}>
 <section className={styles.hero} aria-labelledby="intro-title">
 <div className={styles.heroCopy}><p className={styles.eyebrow}>日本の「どこ？」が、一目でわかる。</p>
 <h1 id="intro-title">今日は、<br/>どこを探そう。</h1>
 <p className={styles.intro}>週末のお出かけも、旅先の寄り道も。<br/>気になる施設・スポットを、地図で探そう。</p>
 <div className={styles.heroActions}><a className={styles.primary} href="#categories">探したいカテゴリを選ぶ <span aria-hidden="true">↓</span></a><a className={styles.secondary} href="/map">すぐ地図を見る <span aria-hidden="true">→</span></a></div>
 </div>
 <div className={styles.heroArt} aria-hidden="true">
 <span className={styles.heroStamp}>寄り道、見つけよう。</span>
 {["aquarium","roadside-station","hot-spring","castle"].map((slug,i)=><div key={slug} className={styles.artTile+" "+styles["tile"+i]}><img src={"/category-assets/"+slug+".webp"} width={128} height={128} alt=""/></div>)}
 </div>
 </section>
 <CategoryDirectory/>
 <section className={styles.guides} aria-labelledby="guides-title"><div><p className={styles.eyebrow}>地域からじっくり探す</p><h2 id="guides-title">お出かけ先を、一覧から。</h2><p>掲載施設と地域別の件数を確認して、地図へ。</p></div><div className={styles.guideLinks}>{[["aquarium","水族館"],["zoo","動物園"],["roadside-station","道の駅"]].map(([slug,name])=><a key={slug} href={"/guides/"+slug}><img src={"/category-assets/"+slug+".webp"} width={44} height={44} alt=""/><span>{name}のガイド</span><span aria-hidden="true">→</span></a>)}</div></section>
 <section className={styles.steps} aria-labelledby="steps-title"><div><p className={styles.eyebrow}>HOW TO EXPLORE</p><h2 id="steps-title">探し方は、3ステップ。</h2></div>
 <ol><li><span>01</span><h3>カテゴリを選ぶ</h3><p>水族館、道の駅、温泉など、気になるジャンルから。</p></li><li><span>02</span><h3>地域を絞る</h3><p>都道府県を選んだり、施設名・地域名で検索。</p></li><li><span>03</span><h3>場所をチェック</h3><p>地点を選んで住所や公式サイトを確認。リンクの共有もできます。</p></li></ol></section>
 <section className={styles.about}><h2>旅にも、日常にも。</h2><p>日本各地の施設・スポットを、公開データや公式情報をもとに掲載しています。掲載範囲とデータの更新時点はカテゴリごとに異なります。営業状況や利用条件は、各施設・自治体の公式情報でご確認ください。</p><a href="/map">地図から探してみる <span aria-hidden="true">→</span></a></section>
 </main>
 <footer className={styles.footer}><span>にっぽんマップ <small>BETA</small></span><a href="/privacy">プライバシー・利用計測の設定</a></footer>
 </div>;
}
