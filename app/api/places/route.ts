import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
export const dynamic="force-dynamic";
const allowed=new Set(["airport","roadside-station","aquarium","shelter","zoo","world-heritage","national-park","railway","museum","park","toilet"]);
const PAGE=1000;
const GSI="https://hinanmap.gsi.go.jp/hinanjocp/defaultFtpData/csv/mergeFromCity_2.csv";
const prefs=["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"];
function csvRows(s:string){const out:string[][]=[];let row:string[]=[],v="",q=false;for(let i=0;i<s.length;i++){const ch=s[i];if(q){if(ch==='"'&&s[i+1]==='"'){v+='"';i++}else if(ch==='"')q=false;else v+=ch}else if(ch==='"')q=true;else if(ch===","){row.push(v);v=""}else if(ch==="\n"){row.push(v.replace(/\r$/,""));out.push(row);row=[];v=""}else v+=ch}if(v||row.length){row.push(v);out.push(row)}return out}
function prefOf(s:string){return prefs.find(p=>s.startsWith(p))||""}
async function shelterRows(){
 const r=await fetch(GSI,{next:{revalidate:86400}});
 if(!r.ok)throw new Error("GSI shelter data unavailable");
 const text=(await r.text()).replace(/^\uFEFF/,"");
 return csvRows(text).slice(1);
}
export async function GET(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 const category=req.nextUrl.searchParams.get("category")||"airport",prefecture=req.nextUrl.searchParams.get("prefecture"),summary=req.nextUrl.searchParams.get("summary")==="1";
 if(!allowed.has(category))return NextResponse.json({places:[],error:"Invalid category"},{status:400});
 if(category==="shelter"){
  try{
   const rows=await shelterRows();
   if(summary||!prefecture){
    const m=new Map<string,{place_count:number,longitude:number,latitude:number}>();
    for(const r of rows){const p=prefOf(r[2]||"");const lat=Number(r[14]),lon=Number(r[15]);if(!p||!Number.isFinite(lat)||!Number.isFinite(lon))continue;const x=m.get(p)||{place_count:0,longitude:0,latitude:0};x.place_count++;x.longitude+=lon;x.latitude+=lat;m.set(p,x)}
    const data=[...m].map(([prefecture_name,x])=>({prefecture_name,place_count:x.place_count,longitude:x.longitude/x.place_count,latitude:x.latitude/x.place_count}));
    return NextResponse.json({summary:data,source:"国土地理院 指定緊急避難場所データ",notice:"国土地理院公開データ。最新でない場合や未掲載の場合があります。最新情報は各市町村で確認してください。"});
   }
   const places=rows.filter(r=>prefOf(r[2]||"")===prefecture).map((r,i)=>({id:-(i+1),name:r[3],category_slug:"shelter",category_name:"指定緊急避難場所",prefecture_name:prefecture,municipality_name:(r[2]||"").slice(prefecture.length),address:r[4],latitude:Number(r[14]),longitude:Number(r[15]),official_url:null,data_date:null,hazards:{flood:r[5]==="1",landslide:r[6]==="1",storm_surge:r[7]==="1",earthquake:r[8]==="1",tsunami:r[9]==="1",fire:r[10]==="1",inland_flood:r[11]==="1",volcano:r[12]==="1"}})).filter(p=>Number.isFinite(p.latitude)&&Number.isFinite(p.longitude));
   return NextResponse.json({places,source:"国土地理院 指定緊急避難場所データ",notice:"最新でない場合や未掲載の場合があります。最新情報は各市町村で確認してください。"});
  }catch(e){return NextResponse.json({places:[],summary:[],error:e instanceof Error?e.message:"Shelter data error"},{status:502})}
 }
 if(!url||!key)return NextResponse.json({places:[],error:"Database configuration is missing"},{status:500});
 const db=createClient(url,key);
 if(summary){const {data,error}=await db.rpc("get_public_place_prefecture_counts",{p_category_slug:category});if(error)return NextResponse.json({summary:[],error:error.message},{status:500});return NextResponse.json({summary:data||[]})}
 const places:unknown[]=[];for(let from=0;;from+=PAGE){const {data,error}=await db.rpc("get_public_places_by_category_and_prefecture",{p_category_slug:category,p_prefecture_name:prefecture||null}).range(from,from+PAGE-1);if(error)return NextResponse.json({places:[],error:error.message},{status:500});const batch=data||[];places.push(...batch);if(batch.length<PAGE)break}
 return NextResponse.json({places});
}
