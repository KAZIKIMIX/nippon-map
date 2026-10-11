# 施設情報提供の管理者レビュー手順

## 対象と権限
- 対象テーブル: `public.place_submissions`。
- 公開フォームは INSERT のみ。報告一覧、連絡先、レビュー情報を一般ユーザー向け API に公開しない。
- 承認・却下は Supabase 管理画面など、管理者権限でのみ実施する。
- 現状の状態は `pending`, `approved`, `rejected`。データベースへの報告登録だけでは施設データは変更されない。

## 10 ステップのレビュー手順
1. 管理画面で `status = pending` の報告を古い順に確認する。
2. `submission_type`（add/update/closure）で種別を確認する。
3. `place_id` がある場合、対象の `places` レコードを照合する。
4. `category_slug` と施設のカテゴリを照合する。
5. 施設名、都道府県、住所の一致を確認する。
6. 同じ施設・同じ変更内容の未処理報告がないか照合する。
7. 根拠URL・補足内容の妥当性を確認する。URLは信頼できる公式ソースを優先する。
8. 承認できる場合は、まず施設データを管理者が修正し、公開地図への影響を確認する。閉鎖報告は証拠が十分な場合に限り施設を無効化する。
9. 修正完了後に `status = approved`, `reviewed_at = now()` とし、`review_note` に判断根拠を記録する。承認できない場合は `rejected` と理由を記録する。
10. 公開地図で修正を確認し、重複する報告を別途整理する。

## 管理者用の読み取りクエリ（SQL Editor でのみ実行）
```sql
select id, submission_type, place_id, category_slug, name,
       prefecture_name, address, evidence_url, note,
       status, created_at
from public.place_submissions
where status = 'pending'
order by created_at asc, id asc
limit 100;
```

## 重複候補の確認（SQL Editor でのみ実行）
```sql
select submission_type, place_id, category_slug, lower(trim(name)) as normalized_name,
       count(*) as pending_count, array_agg(id order by created_at) as report_ids
from public.place_submissions
where status = 'pending'
group by submission_type, place_id, category_slug, lower(trim(name))
having count(*) > 1
order by pending_count desc;
```

## 注意事項
- `contact_email` は個人情報のため、公開 API やログに出さない。
- `approved` への変更だけで `places` が自動更新される仕組みはない。
- データベースの重複防止制約は未適用。現時点の HTTP 409 は、DB が一意制約違反を返した場合の案内に限る。
- 自動承認、一般ユーザー向け管理画面、公開 API の一覧取得は追加しない。
