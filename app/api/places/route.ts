import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
const allowed=new Set(["airport","roadside-station","aquarium","shelter"]);
export async function GET(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL;
 const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({places:[],error:"Database configuration is missing"},{status:500});
 const category=req.nextUrl.searchParams.get("category")||"airport";
 if(!allowed.has(category))return NextResponse.json({places:[],error:"Invalid category"},{status:400});
 const db=createClient(url,key);
 const {data,error}=await db.rpc("get_public_places_by_category",{p_category_slug:category});
 if(error)return NextResponse.json({places:[],error:error.message},{status:500});
 return NextResponse.json({places:data||[]});
}
