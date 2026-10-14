# にっぽんマップ｜公開優先・30日集客実験（2026-10-14）

## 方針
公開済みBETAを維持し、施設データの全件完成を公開・告知の前提条件にしない。重大な障害、セキュリティ、権利・誤情報の問題は優先修正。承認済みアイコンとロゴは維持する。

## 初期計測（2026-10-09以降、2026-10-14確認）
public.map_usage_events: page_view 119（direct 111、other 3、search 1、x 4）、place_open 65、share_copy 5、category_select 105。操作回数であり人数ではない。運営テスト・計測漏れ・referrer制限の可能性を明記する。

## 30日間の実行
### 第1週：公開告知と導線確認
- Xで用途別に3〜5本の投稿を検証。投稿先URLに utm_source=x&utm_medium=social&utm_campaign=launch_aquarium 等を付与する。
- 水族館 https://nippon-map.vercel.app/guides/aquarium
- 動物園 https://nippon-map.vercel.app/guides/zoo
- 道の駅 https://nippon-map.vercel.app/guides/roadside-station
- 地図 https://nippon-map.vercel.app/map
- スマホでカテゴリ選択→地図→施設詳細→共有が可能か確認する。

### 第2週：検索需要
- Search Consoleの実測で表示回数のあるクエリ・ページを優先。
- 検索意図と施設データの整合するガイドを改善。薄い自動生成ページは量産しない。
- OGP、canonical、サイトマップ、404を検査する。

### 第3週：比較実験
- 投稿テーマ別にリンククリックと利用操作の傾向を比較。
- 「週末の寄り道」「旅先で探す」「地域で探す」など異なる切り口を比較。
- 地図の検索結果が見つけやすいか、離脱を誘う不具合を修正。

### 第4週：伸びた企画へ集中
- Search Consoleと利用計測の数字を集計。
- 良かったテーマをシリーズ化。低反応テーマは見直す。
- 施設データの修正依頼を受け付け、審査して反映する。

## 投稿案（未投稿・運営者が確認して公開）
1. 「日本の水族館、地図で探せます。次の休みに行きたい場所を探すときに。」→ /guides/aquarium
2. 「旅の途中に道の駅を探したいとき。都道府県から探せる地図を公開しました。」→ /guides/roadside-station
3. 「動物園を都道府県から探せるようにしました。知らなかった場所が見つかるかも。」→ /guides/zoo
4. 「『日本のどこにある？』を地図で探す、にっぽんマップを公開中。使いにくいところや掲載情報の間違いも教えてください。」→ /map

## 判断指標
- Search Console：検索表示回数、クリック、CTR、インデックス状況
- map_usage_events：page_view、category_select、place_open、share_copy、source
- データの欠損と誤情報報告、重大な不具合
- 指標の変化を比較する際はテスト操作、曜日、投稿本数、計測制限に注意

## 収益化
初月は広告収益より流入と利用体験を優先。AdSense申請は最新の公式ポリシー・コンテンツ品質・プライバシーを確認してから。スポンサー掲載は広告であることを明示し、実績と運用体制が整うまで販売しない。
