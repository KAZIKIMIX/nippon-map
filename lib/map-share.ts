export type SharedMapState = {category: string|null; prefecture: string|null; query: string; placeId: number|null; city?: string};
const prefectures = new Set("北海道 青森県 岩手県 宮城県 秋田県 山形県 福島県 茨城県 栃木県 群馬県 埼玉県 千葉県 東京都 神奈川県 新潟県 富山県 石川県 福井県 山梨県 長野県 岐阜県 静岡県 愛知県 三重県 滋賀県 京都府 大阪府 兵庫県 奈良県 和歌山県 鳥取県 島根県 岡山県 広島県 山口県 徳島県 香川県 愛媛県 高知県 福岡県 佐賀県 長崎県 熊本県 大分県 宮崎県 鹿児島県 沖縄県".split(" "));
export function readSharedMap(search: string, categories: readonly string[]): SharedMapState {
 const params = new URLSearchParams(search);
 const rawCategory = params.get("category");
 const category = rawCategory && categories.includes(rawCategory) ? rawCategory : null;
 const rawPrefecture = params.get("prefecture");
 const rawId = params.get("place");
 const id = rawId && /^[1-9]\d*$/.test(rawId) ? Number(rawId) : null;
 return {category, prefecture: category && rawPrefecture && prefectures.has(rawPrefecture) ? rawPrefecture : null, query: category ? (params.get("q") || "").slice(0,100) : "", placeId: category && id && Number.isSafeInteger(id) ? id : null, city: category ? (params.get("city") || "").slice(0,100) : ""};
}
export function createSharedMapUrl(origin: string, state: SharedMapState): string {
 const url = new URL("/map", origin);
 if (state.category) {
  url.searchParams.set("category", state.category);
  if (state.prefecture) url.searchParams.set("prefecture", state.prefecture);
  if (state.query.trim()) url.searchParams.set("q", state.query.trim().slice(0,100));
  if (state.city?.trim()) url.searchParams.set("city", state.city.trim().slice(0,100));
  if (state.placeId && Number.isSafeInteger(state.placeId) && state.placeId > 0) url.searchParams.set("place", String(state.placeId));
 }
 return url.toString();
}
