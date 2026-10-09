# 利用計測の運用
導入日：2026-10-09
対象DB：zkehvxstlogqzidwksnb
記録テーブル：public.map_usage_events
API：POST /api/usage
設定ページ：/privacy

## 数値の意味
- page_view：ページを開いた回数。リロードは増える。利用人数ではない。
- category_select：カテゴリが変わった回数。カテゴリ付きURLの初期表示を含む。同じカテゴリの連続クリックは増えない。
- place_open：施設詳細が開いた回数。共有リンクからの復元を含む。同じ施設を閉じて再度開くと増える。
- share_copy：クリップボードへのコピーが成功した回数。投稿・送信が完了した回数ではない。
操作を結び付けるIDはないため、個人単位のファネル・再訪率・ユニークユーザー数は計算できない。
停止設定・DNT/GPC・ネットワーク失敗・広告ブロッカー等で取りこぼす。ボットや運営の確認操作を自動除外しない。比率は傾向比較に使い、人数やコンバージョン率と呼ばない。
流入元は参照元の大まかな分類。ブラウザの参照元制限で直接/その他に分類されることがある。
告知リンクには utm_source=x または utm_source=instagram を利用可能。任意のUTM文字列は保存しない。
日付は日本時間のみ保存。イベント行IDはDB内部用で利用者識別には使わない。

## 閲覧権限
一般利用者には許可した3列のINSERTだけを許可。SELECT/UPDATE/DELETEは許可しない。
本文は512バイトまで、イベント・カテゴリ・流入元は許可リスト。追加フィールドは拒否。同一オリジンを検証。
公開APIへの偽装イベントを完全に排除する仕組みはない。急な増加は告知効果と断定せず、配信ログや実際のクリックと照合する。
DB公開キーで書き込み可能な設計であるため、OriginチェックはAPIレベルの限定的な対策。異常増加時はINSERT権限を撤回して計測を停止し、改めて専用認証の書き込み経路を検討する。

## 週次集計SQL
```sql
select event_day, event_name, category_slug, source, count(*) as operation_count
from public.map_usage_events
where event_day >= (now() at time zone 'Asia/Tokyo')::date - 6
group by event_day,event_name,category_slug,source
order by event_day desc,event_name,operation_count desc;
```
週ごとに、投稿→訪問、カテゴリ、施設詳細、共有の回数傾向を比較する。
初回告知前の確認操作はテストとして扱う。

## ローカル確認
依存関係のインストール後に `node tests/usage.test.cjs` を実行する。

## 告知画像
`public/social/launch-20261009.png`（1200×630）と編集用SVGを保存。既存ロゴ・4カテゴリのアイコンを再利用し、元のアイコンファイルは変更していない。OGP/Twitterカードにも設定する。
