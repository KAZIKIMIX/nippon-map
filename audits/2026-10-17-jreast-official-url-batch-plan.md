# JR東日本公式駅URL 一括照合・監査（2026-10-17）

## 現状
- 作業開始時未登録 1,016 件。DB クエリの railway / active / operators 東日本旅客鉄道 / URL blank に基づく。
- 今回、柏駅 (places.id=9685) と君津駅 (id=10704) を公式ページの駅名・都道府県と照合し URL + metadata.official_url_research を更新。更新後 1,014 件。
- JR東日本対象 1,628 件、JR東日本時刻表ドメイン URL 498 件、特に汎用トップ URL 110 件（後者は追加監査が必要）。これらは網羅性・正確性を保証しない。
- 過去の検証 CSV: research/jreast_verified_20261015.csv, research/jreast_verified_additional_20261015.csv, research/jreast_verified_batch_20261015_02.csv。CSV 内の URL を無検証で全件反映しない。

## 一括実行設計
1. Supabase service-role credential は GitHub Actions Secrets に置き、絶対に NEXT_PUBLIC へ置かない。公開 UI は変更不要。
2. 全 1,014 件をページング取得し、対象 ID・駅名・都道府県・路線・事業者・現在の公式 URL をローカル JSON にスナップショット保存する。
3. JR東日本の *現存する公式駅案内・公式路線一覧* を収集。個別URLは実ページから見つけたリンクのみ使用し StationCD を推測生成しない。
4. 候補は (a) JR公式ドメイン (b) 公式ページの見出し駅名一致 (c) 掲載住所都道府県一致、または路線掲載の明示 (d) 対象駅が実際に掲載、の全条件を確認する。単なる URL 200/検索結果一致は不採用。駅名重複・旧名称・境界駅は要手動精査へ。
5. 正規化は駅の接尾辞「駅」、全角半角、空白、Unicode NFKC のみ。漢字異体字の曖昧一致は要確認のまま。
6. 結果は verified / ambiguous / not_found / fetching_failed に分割したレビュー CSV を作る。根拠欄には URL、見出し、住所/路線、照合日を保存。
7. DBへ反映する際は WHERE id=? AND NULLIF(btrim(official_url),'') IS NULL として既存登録を保護し、metadata.official_url_research に検証情報を保存。更新した行 ID を RETURNING で記録する。
8. 反映後、DB再取得 → 公開 API /api/place-details と本番の駅詳細表示 → リンク先の再取得を検証。404、転送、相違は失敗として記録。
9. 別ジョブで既存登録 URL を監査。st_search.cgi?rosen, timetable/list*.html と総合トップURLは URL の存在だけで正常判定しない。
10. 失敗した取得方式は 3 回で保留。公式サイトへのリクエストは低頻度かつ制御し、ブロック時はリトライ連打しない。

## 達成ステータス (今回)
- スナップショット全件: 未実施
- 公式データ全件収集: 未実施
- 一括照合: 未実施
- DB更新: 2件
- DBで更新確認: 2件
- 個別公式ページ閲覧確認: 2件
- 公開サイトの個別リンク動作: 未実施
- GitHubコード変更: この監査文書のみ（本番UIの変更なし）

## 参考（検証した実在ページ）
- 柏駅 https://www.jreast.co.jp/estation/station/info.aspx?StationCD=434
- 君津駅 https://www.jreast.co.jp/estation/station/info.aspx?StationCd=601
