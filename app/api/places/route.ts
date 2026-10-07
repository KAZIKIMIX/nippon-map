import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
const allowed=new Set(["airport","roadside-station","aquarium","shelter"]);
const PAGE=1000;
export async function GET(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({places:[],error:"Database configuration is missing"},{status:500});
 const category=req.nextUrl.searchParams.get("category")||"airport";
 const prefecture=req.nextUrl.searchParams.get("prefecture");
 const summary=req.nextUrl.searchParams.get("summary")==="1";
 if(!allowed.has(category))return NextResponse.json({places:[],error:"Invalid category"},{status:400});
 const db=createClient(url,key);
 if(summary){
  const {data,error}=await db.rpc("get_public_place_prefecture_counts",{p_category_slug:category});
  if(error)return NextResponse.json({summary:[],error:error.message},{status:500});
  return NextResponse.json({summary:data||[]});
 }
 const places:unknown[]=[];
 for(let from=0;;from+=PAGE){
  const {data,error}=await db.rpc("get_public_places_by_category_and_prefecture",{p_category_slug:category,p_prefecture_name:prefecture||null}).range(from,from+PAGE-1);
  if(error)return NextResponse.json({places:[],error:error.message},{status:500});
  const batch=data||[];places.push(...batch);
  if(batch.length<PAGE)break;
 }
 return NextResponse.json({places});
}
