import {createClient} from "@supabase/supabase-js";
import {NextResponse} from "next/server";
export const dynamic="force-dynamic";
export async function GET(){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL; const key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({places:[],error:"Database configuration is missing"},{status:500});
 const db=createClient(url,key); const {data,error}=await db.rpc("get_public_places");
 if(error)return NextResponse.json({places:[],error:error.message},{status:500});
 return NextResponse.json({places:data||[]});
}