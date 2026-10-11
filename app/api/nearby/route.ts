import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
import {mapCategories} from "../../../lib/map-categories";
export const dynamic="force-dynamic";
const allowed=new Set(mapCategories.map(c=>c.slug));
function distanceKm(lat:number,lon:number,otherLat:number,otherLon:number){
 const a=(otherLat-lat)*Math.PI/180,b=(otherLon-lon)*Math.PI/180;
 const h=Math.sin(a/2)**2+Math.cos(lat*Math.PI/180)*Math.cos(otherLat*Math.PI/180)*Math.sin(b/2)**2;
 return 6371*2*Math.atan2(Math.sqrt(Math.max(0,h)),Math.sqrt(Math.max(0,1-h)));
}
export async function GET(req:NextRequest){
 const params=req.nextUrl.searchParams;
 const latitude=Number(params.get("lat")),longitude=Number(params.get("lon")),radius=Number(params.get("radius")||10);
 const category=params.get("category");
 if(!params.has("lat")||!params.has("lon")||!Number.isFinite(latitude)||!Number.isFinite(longitude)||Math.abs(latitude)>90||Math.abs(longitude)>180||!([5,10,30] as number[]).includes(radius)||category&&!allowed.has(category))
  return NextResponse.json({error:"Invalid nearby search parameters"},{status:400});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Database unavailable"},{status:503});
 const latDelta=radius/110.574,lonDelta=radius/(111.32*Math.max(Math.cos(latitude*Math.PI/180),0.01));
 const db=createClient(url,key);
 try{
  const PAGE_SIZE=500,MAX_PAGES=20;
  type NearbyRow={id:number;name:string;prefecture_name:string;municipality_name:string;address:string;latitude:number;longitude:number;official_url:string|null;data_date:string|null;categories:{slug:string;name:string}|{slug:string;name:string}[]};
  const rows:NearbyRow[]=[];
  let limited=false;
  for(let page=0;page<MAX_PAGES;page++){
   const {data,error}=await db.from("places").select("id,name,prefecture_name,municipality_name,address,latitude,longitude,official_url,data_date,categories!inner(slug,name)")
    .eq("is_active",true).gte("latitude",Math.max(-90,latitude-latDelta)).lte("latitude",Math.min(90,latitude+latDelta))
    .gte("longitude",Math.max(-180,longitude-lonDelta)).lte("longitude",Math.min(180,longitude+lonDelta))
    .in("categories.slug",category?[category]:[...allowed]).order("id",{ascending:true})
    .range(page*PAGE_SIZE,(page+1)*PAGE_SIZE-1).abortSignal(AbortSignal.timeout(10000));
   if(error)throw error;
   rows.push(...(data||[]) as NearbyRow[]);
   if((data||[]).length<PAGE_SIZE)break;
   if(page===MAX_PAGES-1)limited=true;
  }
  const places=rows.map(row=>{
   const c=Array.isArray(row.categories)?row.categories[0]:row.categories;
   const {categories:unused,...place}=row;
   void unused;
   return {...place,category_slug:c?.slug||"",category_name:c?.name||"",distance_km:distanceKm(latitude,longitude,Number(row.latitude),Number(row.longitude))};
  }).filter(row=>Number.isFinite(row.distance_km)&&row.distance_km<=radius).sort((a,b)=>a.distance_km-b.distance_km||a.id-b.id).slice(0,100);
  return NextResponse.json({places,radius,limited},{headers:{"Cache-Control":"private, no-store"}});
 }catch{return NextResponse.json({error:"周辺施設を取得できませんでした。"},{status:503})}
}
