import type {Metadata} from "next";
import CampaignPageView from "../../components/CampaignPageView";
export const metadata:Metadata={title:"ここどこchからのお出かけ探し｜にっぽんマップ",description:"ここどこchで見つけた旅先の周辺施設を地図で探す。水族館、動物園、道の駅などを地域別に比較できます。",alternates:{canonical:"/kokodoko"}};
const q="?utm_source=x&utm_medium=social&utm_campaign=kokodoko";
const items=[["aquarium","水族館"],["zoo","動物園"],["roadside-station","道の駅"]];
export default function Kokodoko(){
 return <main style={{maxWidth:800,margin:"auto",padding:"40px 20px",fontFamily:"sans-serif",lineHeight:1.8}}>
 <CampaignPageView/><a href="/">にっぽんマップ</a><p>ここどこch × にっぽんマップ</p>
 <h1>気になった旅先の、次の寄り道を探そう。</h1>
 <p>旅行先やお出かけ先で、近くにどんな施設があるか。日本全国の施設を地図で探せます。</p>
 <p><a href={"/map"+q}>全国の地図を開く →</a></p>
 <h2>カテゴリから探す</h2>
 <ul>{items.map(([slug,name])=><li key={slug}><a href={"/guides/"+slug+q}>{name}を地域別に探す →</a></li>)}</ul>
 <p>地図では都道府県や施設名で絞り込み、複数カテゴリを重ねて表示できます。</p>
 <p>掲載範囲はカテゴリによって異なります。営業状況・料金は施設の公式情報でご確認ください。</p>
 <footer><a href="/privacy">プライバシー・利用計測の設定</a></footer>
 </main>;
}
