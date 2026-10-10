import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
const allowedCategories=new Set(["airport","roadside-station","aquarium","shelter","zoo","world-heritage","national-park","railway","museum","park","toilet","castle","lighthouse","hot-spring","botanical-garden","campsite","observation-deck","theme-park","factory-tour","horse-racing","velodrome","sightseeing"]);
const allowedTypes=new Set(["add","update","closure"]);
const clean=(v:unknown,max=500)=>typeof v==="string"?v.trim().slice(0,max):"";
export async function POST(req:NextRequest){
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Database configuration is missing"},{status:500});
 let b:Record<string,unknown>;try{const parsed:unknown=await req.json();if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Invalid payload");b=parsed as Record<string,unknown>}catch{return NextResponse.json({error:"Invalid request"},{status:400})}
 const submission_type=clean(b.submission_type,20),category_slug=clean(b.category_slug,50),name=clean(b.name,160);
 if(!allowedTypes.has(submission_type)||!allowedCategories.has(category_slug)||!name)return NextResponse.json({error:"入力内容を確認してください。"},{status:400});
 const evidence_url=clean(b.evidence_url,500);if(evidence_url){try{const u=new URL(evidence_url);if(!["http:","https:"].includes(u.protocol))throw new Error()}catch{return NextResponse.json({error:"根拠URLを確認してください。"},{status:400})}}
 const rawId=b.place_id==null||b.place_id===""?null:Number(b.place_id);if(rawId!==null&&(!Number.isSafeInteger(rawId)||rawId<=0))return NextResponse.json({error:"施設IDを確認してください。"},{status:400});const place_id=rawId;
 const db=createClient(url,key);const {error}=await db.from("place_submissions").insert({submission_type,place_id,category_slug,name,prefecture_name:clean(b.prefecture_name,40)||null,address:clean(b.address,300)||null,evidence_url:evidence_url||null,note:clean(b.note,1200)||null,contact_email:clean(b.contact_email,254)||null,status:"pending"});
 if(error)return NextResponse.json({error:"送信できませんでした。"},{status:500});
 return NextResponse.json({ok:true,status:"pending"});
}
