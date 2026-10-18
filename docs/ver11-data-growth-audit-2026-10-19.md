# Ver.1.1｜施設品質・利用分析・収益化の実測監査（2026-10-19）

## 計測条件
- Supabase `public.places` の `is_active=true` のみ対象。登録総件数とは区別。
- 集計は監査時点のスナップショット。住所/URLが登録済みでも正確性は別途検証が必要。
- `map_usage_events` はイベント回数であり、ユーザー数・セッション数・広告PVではない。
- `is_developer=false` も運営者操作混入の可能性がある。`null` は判別不能として別集計。

## 施設データの実測
| カテゴリ | 有効施設 | 公式URL未登録 | 住所未登録 |
| --- | ---: | ---: | ---: |
| railway | 9,043 | 7,723 | 0 |
| roadside-station | 1,234 | 0 | 0 |
| park | 336 | 15 | 8 |
| toilet | 253 | 0 | 0 |
| airport | 97 | 0 | 0 |
| zoo | 91 | 0 | 0 |
| aquarium | 86 | 0 | 0 |
| 全22カテゴリ合計 | **11,288** | **7,738** | **8** |

緯度20〜46度・経度122〜154度の広域チェックでは異常0件。正しい施設位置かどうかの判定ではない。

### 再実行可能なカテゴリ別監査SQL
```sql
select c.slug,
       count(*) as active_places,
       count(*) filter (where nullif(btrim(p.official_url),'') is null) as missing_official_url,
       count(*) filter (where nullif(btrim(p.address),'') is null) as missing_address,
       count(*) filter (where p.latitude is null or p.longitude is null
                         or p.latitude not between 20 and 46
                         or p.longitude not between 122 and 154) as broad_coordinate_outliers
from public.places p
join public.categories c on c.id=p.category_id
where p.is_active=true
group by c.slug
order by active_places desc;
```

### 重複候補（自動削除は禁止）
```sql
select c.slug,p.prefecture_name,lower(btrim(p.name)) as normalized_name,
       count(*) as candidates,array_agg(p.id order by p.id) as ids
from public.places p
join public.categories c on c.id=p.category_id
where p.is_active=true
group by 1,2,3 having count(*)>1
order by candidates desc,slug,p.prefecture_name
limit 500;
```
同名駅が別事業者・別地点に実在するため、名称一致のみでは重複確定しない。駅は事業者・路線・座標、施設は出典・住所を突き合わせる。

## 利用イベントの実測（全期間）
| 判別区分 | page_view | category_select | place_open | share_copy | 合計 |
| --- | ---: | ---: | ---: | ---: | ---: |
| is_developer=false | 107 | 309 | 78 | 0 | **494** |
| is_developer=true | 5 | 1 | 3 | 0 | **9** |
| is_developer=null | 881 | 1,500 | 563 | 6 | **2,950** |

`false` のカテゴリ選択は空港127、鉄道119、水族館42、図書館7、公衆トイレ7、国立公園7。施設詳細表示は空港43、鉄道35。**一般ユーザーの行動と断定しない**。Search Consoleのクエリ・表示回数は未取得。

### 週次監査SQL
```sql
select event_day,is_developer,event_name,source,category_slug,count(*) as event_count
from public.map_usage_events
where event_day >= (now() at time zone 'Asia/Tokyo')::date - 6
group by 1,2,3,4,5
order by event_day desc,event_count desc;
```

## SEO・収益化
- 水族館・動物園・道の駅の地域別ガイドは既存。PR #7 でカテゴリ内地域リンクを追加し、PR #8 でリンクとサイトマップの本番検証を追加。直近の4ワークフロー成功。
- Google AdSense公式は独自性のあるコンテンツ、明確なナビゲーション、ポリシー適合を求める。審査通過は保証されない。
  - https://support.google.com/adsense/answer/9724
  - https://support.google.com/adsense/answer/7299563
- 比較参考（同一商品ではない）：西日本旅行情報のスポンサー記事は5万円（税別）から、京都市観光協会の印刷観光地図は1枠66,000円（税込、2023年募集）。媒体・集客規模・商品形態が違うため、にっぽんマップの適正価格の根拠には使えない。
  - https://westernjapantravel.com/advertising/
  - https://www.kyokanko.or.jp/news/20230829_1/
- 広告やPRの公開・有料契約は未実施。地図操作を妨げる広告、検索順位の販売は避ける。

## 次の優先作業
1. JR東日本の既存照合スクリプト（`scripts/match-jreast-official-urls.cjs`, `scripts/build-jreast-url-update.cjs`）を利用し、駅名・都道府県・路線・公式出典が一致したものだけ検証・一括更新する。未検証のURLは絶対に投入しない。
2. 公園の住所未登録8件・URL未登録15件を自治体一次資料と照合し、監査用差分・ロールバックを作成してから反映する。
3. Search Consoleのページ別・クエリ別実測データが取得できたら、表示回数とCTRをもとに優先順位を決める。未取得の間は需要を推測しない。
4. 広告コードは入れず、既存ガイドの独自情報と出典の品質を高める。
