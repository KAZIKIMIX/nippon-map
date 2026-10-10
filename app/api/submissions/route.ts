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
 const contact_email=clean(b.contact_email,254);if(contact_email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email))return NextResponse.json({error:"メールアドレスを確認してください。"},{status:400});
 if(["prefecture_name","address","note"].some(field=>b[field]!=null&&typeof b[field]!=="string"))return NextResponse.json({error:"入力内容を確認してください。"},{status:400});
 if(b.evidence_url!=null&&typeof b.evidence_url!=="string")return NextResponse.json({error:"根拠URLを確認してください。"},{status:400});
 if(b.contact_email!=null&&typeof b.contact_email!=="string")return NextResponse.json({error:"メールアドレスを確認してください。"},{status:400});
 const idText=b.place_id==null||b.place_id===""?null:typeof b.place_id==="number"||typeof b.place_id==="string"?String(b.place_id):"";const rawId=idText===null?null:/^[1-9]\d{0,14}$/.test(idText)?Number(idText):NaN;if(rawId!==null&&(!Number.isSafeInteger(rawId)||rawId<=0))return NextResponse.json({error:"施設IDを確認してください。"},{status:400});const place_id=rawId;
 if(submission_type!=="add"&&place_id===null)return NextResponse.json({error:"施設IDを確認してください。"},{status:400});
 let error;try{const db=createClient(url,key);({error}=await db.from("place_submissions").insert({submission_type,place_id,category_slug,name,prefecture_name:clean(b.prefecture_name,40)||null,address:clean(b.address,300)||null,evidence_url:evidence_url||null,note:clean(b.note,1200)||null,contact_email:contact_email||null,status:"pending"}))}catch{return NextResponse.json({error:"送信できませんでした。時間をおいて再度お試しください。"},{status:503})}
 if(error)return NextResponse.json({error:"送信できませんでした。"},{status:500});
 return NextResponse.json({ok:true,status:"pending"});
}
