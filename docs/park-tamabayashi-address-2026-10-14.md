# 玉林寺公園 住所補完記録（2026-10-14）

対象: public.places ID 3333、玉林寺公園（東京都西多摩郡瑞穂町）。

根拠: 西多摩地域広域行政圏協議会「公園・自然」 https://www.nishitama-kouiki.jp/publicfacility/park/ に「玉林寺公園｜瑞穂町殿ケ谷1049」と掲載。

変更前: address=null、official_url=null。metadataには park_type=公園、dataset_year=2024、geometry_sha256_prefix=904f7417e62d6ea16890 等が存在。
変更後: address=東京都西多摩郡瑞穂町殿ケ谷1049、official_url=null。metadataに address_precision=street_address と address_verification（source_url、checked_on=2026-10-14、scope=published_address_only）を追加。その他は変更しない。
検証: 更新SQL returning 1件、全公園348件、住所未登録175→174件、公式URL未登録178件。
注意: 出典は地域行政圏の施設一覧。施設個別の公式URL、入口座標、営業・開園状況の独立確認は未実施。

## 条件付き復元SQL（実行前に後続変更の有無を確認）
```sql
begin;
update public.places
set address=null,
    metadata=metadata-'address_precision'-'address_verification'
where id=3333 and name='玉林寺公園'
  and address='東京都西多摩郡瑞穂町殿ケ谷1049'
  and official_url is null
  and metadata->'address_verification'->>'source_url'='https://www.nishitama-kouiki.jp/publicfacility/park/'
  and metadata->'address_verification'->>'checked_on'='2026-10-14';
-- 変更件数が必ず1件であることを確認する。既定ではロールバック。
rollback;
```
