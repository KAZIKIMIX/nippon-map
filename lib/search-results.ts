// Official rename: https://www.city.uwajima.ehime.jp/soshiki/22/yasuragi-rename.html
export function canonicalPlaceSearch(value:string):string{
 return value.normalize("NFKC").replace(/津島[やヤ][すス][らラ][ぎギ][のノ]里/g,"津島熱田温泉");
}
export function normalizeSearchText(value:string):string{
 return canonicalPlaceSearch(value).replace(/[ぁ-ゖ]/g,ch=>String.fromCharCode(ch.charCodeAt(0)+96)).toLocaleLowerCase("ja");
}
type SearchResult={id:number;name:string;prefecture_name?:string|null;municipality_name?:string|null};
// The API has already matched the query, including readings. Keep all categories
// and regions here; map filters apply to browsing, not global keyword search.
export function rankGlobalSearchResults<T extends SearchResult>(rows:T[],query:string):T[]{
 const normalized=normalizeSearchText(query);
 const rank=(place:T)=>{
  const name=normalizeSearchText(place.name||""),city=normalizeSearchText(place.municipality_name||""),pref=normalizeSearchText(place.prefecture_name||"");
  return name===normalized?0:name.startsWith(normalized)?1:name.includes(normalized)?2:city===normalized?3:pref===normalized?4:city.includes(normalized)?5:pref.includes(normalized)?6:7;
 };
 return [...new Map(rows.map(place=>[place.id,place])).values()].sort((a,b)=>rank(a)-rank(b)||a.name.localeCompare(b.name,"ja"));
}
export function matchesCategorySearch(aliases:readonly string[],query:string):boolean{
 const normalized=normalizeSearchText(query.trim());
 return Boolean(normalized)&&aliases.some(alias=>{const value=normalizeSearchText(alias);return value.includes(normalized)||normalized.includes(value)});
}
