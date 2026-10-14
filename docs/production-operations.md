# 本番運用・復旧手順（にっぽんマップ）

## 毎日の監視
GitHub Actions → **Production health and SEO** を確認。毎日 UTC 02:17（日本時間 11:17）に実行する。main の地図/API/SEO関連変更時にも起動する。手動実行は **Run workflow**。

失敗時は Actions → 該当 run → `Check public API, map, guides and sitemap` / `Check sitemap URLs, canonical and structured data` / `Record API latency and cache headers` のログを確認する。GitHub の個人設定 **Notifications** で Actions の失敗通知の受信設定と通知先メールを確認し、意図的に本番障害を発生させず、テスト用ワークフローなどで通知経路を検証する。

## 遅延の切り分け
`Record API latency and cache headers` の JSON 行の `elapsed_ms` を初回と2回目で比較する。`x-vercel-cache` / `age` と施設詳細APIの `server-timing` を比較し、DB実行時間が短く全体が遅いなら起動/ネットワーク/配信層を疑う。異なる日時で繰り返し測定し、1回の遅延だけで原因を断定しない。

## バックアップ確認（本番を変更しない）
Supabase Dashboard → Project → Database → Backups → Scheduled Backups と Point in Time を確認する。実際にバックアップがあるか、最終成功日時、最古の復元可能日時、PITRの有無、契約プランを記録する。Freeプランの場合、Supabase CLI `db dump` を使ったオフサイト保管を計画する。バックアップの有無はSQLの実行だけでは確認できない。

## 復元前チェック
本番で直接復元を試さない。先に隔離したテスト環境へバックアップを復元し、施設件数、検索、カテゴリ別一覧、権限/RLS、ユーザー投稿の整合性を確認する。バックアップにStorage APIの実ファイルが含まれない点に注意する。復元時は対象時刻とデータ損失範囲を明示し、メンテナンス時間を確保する。

公式仕様: https://supabase.com/docs/guides/platform/backups
