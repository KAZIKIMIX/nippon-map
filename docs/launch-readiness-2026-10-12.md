# にっぽんマップ｜正式公開判定（2026-10-12）

## 判定基準
- [ ] 最新 main のコミットと Vercel production のコミットが一致
- [ ] 最新の検索順位・地図ピン位置・共有機能が本番で動作
- [ ] iPhone Safari：検索→施設選択→地図移動→詳細→閉じる→共有→フォーム
- [ ] Android Chrome：同じ一連操作と位置・スクロールを確認
- [ ] PC Chrome/Safari：地図、検索、リンク、フォーム、キーボード操作を確認
- [ ] 共有URLを新規タブで開き、カテゴリ・検索語・施設選択が復元
- [ ] 404/500・検索0件・ネットワーク障害時の表示が適切
- [ ] 既存の production smoke / interactions / responsive / SEO / types / build が通過
- [ ] 出典・プライバシー・利用規約・投稿の審査フローを確認
- [ ] 未解決の重大不具合がゼロである

## BETA表記を外す条件
上記がすべて確認済みで、公開後の障害連絡・復旧手順と運用担当が定まっていること。未確認項目を「合格」と扱わない。BETAを外す変更は条件を満たしてから実施する。

## 2026-10-12時点の確認結果
- GitHub commit `16a2905317248b61f97eb17500aff3ffbe897978` の Vercel commit status は success。
- これ以降のコミットがある場合、最新 production との一致は別途確認する。
- GitHub commit status の success は実機の操作検証を意味しない。
- Vercel API は権限403、実行環境からの公開サイトへのネットワーク接続も不可。production URL の実アクセスとデバイス操作は未検証。
- ユーザーによる iPhone Safari の主要操作確認、×ボタン修正確認は実施済み（以前の版）。
- 既存チェック用スクリプトは `npm run check:production`、`check:interactions`、`check:responsive`、`check:seo`、`check:types`、`npm run build`。

## 手動検証記録欄
| 項目 | 端末/ブラウザ | 結果 | 日時 | 備考 |
| --- | --- | --- | --- | --- |
| 検索・施設選択 | iPhone Safari | 未検証（最新） | | |
| 共有・復元 | iPhone Safari | 未検証（最新） | | |
| 地図と詳細の重なり | Android Chrome | 未検証 | | |
| PC検索・リンク・フォーム | Chrome/Safari | 未検証（最新） | | |
| 異常系 | 各環境 | 未検証（最新） | | |
