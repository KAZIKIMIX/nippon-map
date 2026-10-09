import {cache} from "react";
import {createClient} from "@supabase/supabase-js";
import type {GuideCategory,GuidePlace} from "./guide-categories";
export const getGuidePlaces=cache(async(category:GuideCategory):Promise<GuidePlace[]>=>{
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)throw new Error("掲載一覧を取得できませんでした。");
 const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false},global:{fetch:(input,init)=>fetch(input,{...init,signal:AbortSignal.timeout(15000),next:{revalidate:600}})}});
 const places:GuidePlace[]=[];
 for(let offset=0;offset<20000;offset+=1000){
  const {data,error}=await db.rpc("get_public_places_by_category_and_prefecture",{p_category_slug:category,p_prefecture_name:null}).order("id",{ascending:true}).range(offset,offset+999);
  if(error)throw new Error("掲載一覧を取得できませんでした。");
  const rows=(data||[]) as GuidePlace[];places.push(...rows);
  if(rows.length<1000)return places;
 }
 throw new Error("掲載一覧を取得できませんでした。");
});
