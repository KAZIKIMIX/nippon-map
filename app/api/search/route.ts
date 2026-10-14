import {createClient} from "@supabase/supabase-js";
import {mapCategories} from "../../../lib/map-categories";
import {canonicalPlaceSearch} from "../../../lib/search-results";
import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const queries=req.nextUrl.searchParams.getAll("q");
 if(queries.length>1)return NextResponse.json({places:[],error:"検索語の指定が重複しています。",has_more:false,partial:false,limit:100},{status:400});
 const q=(queries[0]||"").trim().normalize("NFKC");
 if(!q)return NextResponse.json({places:[],has_more:false,partial:false,limit:100});
 if(q.length>80)return NextResponse.json({places:[],error:"検索語は80文字以内で入力してください。",has_more:false,partial:false,limit:100},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({places:[],error:"検索サービスを利用できません。時間をおいて再度お試しください。",has_more:false,partial:false,limit:100},{status:503});
 const safe=canonicalPlaceSearch(q).replace(/[%,()_"\\]/g,"").replace(/\s+/g," ").trim();
 if(!safe)return NextResponse.json({places:[],has_more:false,partial:false,limit:100});
 const normalizeKana=(v:string)=>v.normalize("NFKC").replace(/[\u3041-\u3096]/g,ch=>String.fromCharCode(ch.charCodeAt(0)+96)).toLocaleLowerCase("ja");
 const terms=safe.split(" ").filter(Boolean);
 if(terms.length>5)return NextResponse.json({places:[],error:"検索語は5語以内にしてください。",has_more:false,partial:false,limit:100},{status:400});
 const toHiragana=(v:string)=>v.normalize("NFKC").replace(/[\u30A1-\u30F6]/g,ch=>String.fromCharCode(ch.charCodeAt(0)-96));
 const variants=[...new Set(terms.flatMap(term=>[term,normalizeKana(term),toHiragana(term)]))].filter(Boolean);
 try{
  const db=createClient(url,key);
  const columns=["name","name_kana","prefecture_name","municipality_name","address"];
  const or=variants.flatMap(term=>columns.map(column=>column+".ilike.%"+term+"%")).join(",");
  const PAGE_SIZE=500,MAX_PAGES=40;
  type SearchRow={id:number;name:string;name_kana:string|null;prefecture_name:string|null;municipality_name:string|null;address:string|null;latitude:number;longitude:number;official_url:string|null;data_date:string|null;categories:{slug:string;name:string}|{slug:string;name:string}[]};
  const data:SearchRow[]=[];
  const selectedCategories=mapCategories.map(c=>c.slug);
  const selectColumns="id,name,name_kana,prefecture_name,municipality_name,address,latitude,longitude,official_url,data_date,categories!inner(slug,name)";
  const deadline=AbortSignal.timeout(25000);
  const normalizedTerms=terms.map(term=>normalizeKana(term));
  let capped=false;
  for(let page=0;page<MAX_PAGES;page++){
   const {data:batch,error}=await db.from("places").select(selectColumns).eq("is_active",true).in("categories.slug",selectedCategories).or(or).order("id",{ascending:true}).range(page*PAGE_SIZE,(page+1)*PAGE_SIZE-1).abortSignal(deadline);
   if(error)throw error;
   if(!Array.isArray(batch)||batch.some(row=>!row||typeof row!=="object"||Array.isArray(row)||typeof row.id!=="number"||typeof row.name!=="string"))throw new Error("Invalid search result");
   data.push(...batch as SearchRow[]);
   if(batch.length<PAGE_SIZE)break;
   if(page===MAX_PAGES-1)capped=true;
  }
  const normalized=(value:string|null|undefined)=>normalizeKana(String(value||""));
  const rows=data.map(row=>{const category=Array.isArray(row.categories)?row.categories[0]:row.categories;return {id:row.id,name:row.name,name_kana:row.name_kana,prefecture_name:row.prefecture_name,municipality_name:row.municipality_name,address:row.address,latitude:row.latitude,longitude:row.longitude,official_url:row.official_url,data_date:row.data_date,category_slug:category?.slug||"",category_name:category?.name||""}});
  const unique=[...new Map(rows.map(row=>[row.id,row] as const)).values()];
  const queryNormalized=normalizeKana(safe);
  const matches=unique.filter(row=>{const fields=[row.name,row.name_kana,row.prefecture_name,row.municipality_name,row.address].map(normalized);return normalizedTerms.every(term=>fields.some(value=>value.includes(term)))});
  const score=(row:typeof matches[number])=>{const name=normalized(row.name),kana=normalized(row.name_kana);return name===queryNormalized||kana===queryNormalized?0:name.startsWith(queryNormalized)||kana.startsWith(queryNormalized)?1:name.includes(queryNormalized)||kana.includes(queryNormalized)?2:normalizedTerms.every(t=>name.includes(t)||kana.includes(t))?3:4};
  matches.sort((a,b)=>score(a)-score(b)||a.name.localeCompare(b.name,"ja")||a.id-b.id);
  return NextResponse.json({places:matches.slice(0,100),has_more:matches.length>100||capped,limit:100,partial:capped},{headers:{"Cache-Control":"public, max-age=15, s-maxage=30"}});
 }catch{return NextResponse.json({places:[],error:"検索データを取得できませんでした。",has_more:false,partial:false,limit:100},{status:503})}
}

