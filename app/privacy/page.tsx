import type {Metadata} from "next";
import UsagePreference from "../../components/UsagePreference";
export const metadata:Metadata={title:"プライバシーと利用計測｜にっぽんマップ",alternates:{canonical:"/privacy"},description:"にっぽんマップの利用計測、記録する情報と停止方法について。"};
export default function Privacy(){
 return <main style={{maxWidth:760,margin:"0 auto",padding:"32px 24px",lineHeight:1.9}}>
 <a href="/">← にっぽんマップへ戻る</a>
 <h1 style={{fontSize:28,margin:"24px 0"}}>プライバシーと利用計測</h1>
 <p>にっぽんマップでは、サービスの改善と告知の効果を確認するため、利用操作の回数を記録しています。</p>
 <h2 style={{fontSize:20,marginTop:28}}>記録する情報</h2>
 <p>ページ表示、カテゴリ選択、施設詳細の表示、共有リンクのコピーの操作種別と、対象カテゴリ、日付（日本時間）、流入元の大まかな分類（直接・X・Instagram・検索・その他）です。個々の利用者や複数の操作を結び付けるIDは設けていません。</p>
 <p>この計測には、IPアドレス、検索語、現在地・座標、閲覧した施設のID、共有URL、参照元URLの全文、氏名・メールアドレスを保存しません。参照元はブラウザ内で分類し、分類結果だけを送信します。</p>
 <p>記録先には、本サービスのデータ管理で利用しているSupabaseを使用します。計測データを一般向けに公開することはありません。この計測用のCookieは使用しません。</p>
 <h2 style={{fontSize:20,marginTop:28}}>利用計測を停止する</h2>
 <UsagePreference/>
 <p>停止設定はこのブラウザに保存します。別の端末・ブラウザでは個別に設定してください。設定を消去すると、ブラウザの追跡拒否設定に従い計測が再開する場合があります。</p>
 <h2 style={{fontSize:20,marginTop:28}}>情報提供フォームと通信について</h2>
 <p>情報の追加・修正フォームに入力された内容と任意の連絡先は、掲載情報の確認・連絡のために利用します。利用計測とは別に管理します。</p>
 <p>サイトの配信、地図や写真の表示、データ取得には外部サービスを利用します。それらのサービスでは、通信に伴いIPアドレスなどが処理される場合があります。上記の「保存しない情報」は、本サイトが追加した利用計測についての説明です。</p>
 <p style={{fontSize:13,marginTop:32}}>更新日：2026年10月9日</p>
 </main>;
}
