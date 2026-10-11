import {createClient} from "@supabase/supabase-js";
import {mapCategories} from "../../../lib/map-categories";
import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(req:NextRequest){
 const q=(req.nextUrl.searchParams.get("q")||"").trim().normalize("NFKC");
 if(q.length<1||q.length>80)return NextResponse.json({places:[]});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({places:[],error:"Database configuration missing"},{status:503});
 const safe=q.replace(/[%,()_"\\]/g,"");
 if(!safe)return NextResponse.json({places:[]});
 try{
  const db=createClient(url,key);
  const {data,error}=await db.from("places").select("id,name,prefecture_name,municipality_name,address,latitude,longitude,official_url,data_date,categories!inner(slug,name)").eq("is_active",true).in("categories.slug",mapCategories.map(c=>c.slug)).or(["name.ilike.%"+safe+"%","prefecture_name.ilike.%"+safe+"%","municipality_name.ilike.%"+safe+"%","address.ilike.%"+safe+"%"].join(",")).order("name").order("id").limit(101).abortSignal(AbortSignal.timeout(10000));
  if(error)throw error;
  const places=(data||[]).map(row=>{const category=Array.isArray(row.categories)?row.categories[0]:row.categories;return {id:row.id,name:row.name,prefecture_name:row.prefecture_name,municipality_name:row.municipality_name,address:row.address,latitude:row.latitude,longitude:row.longitude,official_url:row.official_url,data_date:row.data_date,category_slug:category?.slug||"",category_name:category?.name||""}});
  return NextResponse.json({places:places.slice(0,100),has_more:places.length>100,limit:100},{headers:{"Cache-Control":"public, max-age=15, s-maxage=30"}});
 }catch{return NextResponse.json({places:[],error:"検索データを取得できませんでした。"},{status:503})}
}

