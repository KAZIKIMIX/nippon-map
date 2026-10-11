import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
const allowedCategories=new Set(["airport","roadside-station","aquarium","shelter","zoo","world-heritage","national-park","railway","museum","park","toilet","castle","lighthouse","hot-spring","botanical-garden","campsite","observation-deck","theme-park","factory-tour","horse-racing","velodrome","sightseeing"]);
const allowedTypes=new Set(["add","update","closure"]);
const clean=(v:unknown,max=500)=>typeof v==="string"?v.trim().slice(0,max):"";
const validPrefectures=new Set(["北海道","青森県","岩手県","宮城県","秋田県","山形県","福島県","茨城県","栃木県","群馬県","埼玉県","千葉県","東京都","神奈川県","新潟県","富山県","石川県","福井県","山梨県","長野県","岐阜県","静岡県","愛知県","三重県","滋賀県","京都府","大阪府","兵庫県","奈良県","和歌山県","鳥取県","島根県","岡山県","広島県","山口県","徳島県","香川県","愛媛県","高知県","福岡県","佐賀県","長崎県","熊本県","大分県","宮崎県","鹿児島県","沖縄県"]);
export async function POST(req:NextRequest){
 const origin=req.headers.get("origin");if(origin&&origin!==req.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403});
 const declared=Number(req.headers.get("content-length")||0);if(declared>12000)return NextResponse.json({error:"入力内容が大きすぎます。"},{status:413});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Database configuration is missing"},{status:500});
 let b:Record<string,unknown>;try{const reader=req.body?.getReader();if(!reader)throw new Error("Missing body");const chunks:Uint8Array[]=[];let size=0;while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>12000){await reader.cancel();return NextResponse.json({error:"入力内容が大きすぎます。"},{status:413})}chunks.push(value)}const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length}const parsed:unknown=JSON.parse(new TextDecoder().decode(bytes));if(!parsed||typeof parsed!=="object"||Array.isArray(parsed))throw new Error("Invalid payload");b=parsed as Record<string,unknown>}catch{return NextResponse.json({error:"Invalid request"},{status:400})}
 if(["submission_type","category_slug","name"].some(field=>typeof b[field]!=="string"))return NextResponse.json({error:"入力内容を確認してください。"},{status:400});
 const submission_type=clean(b.submission_type,20),category_slug=clean(b.category_slug,50),name=clean(b.name,160);
 if((b.name as string).trim().length>160)return NextResponse.json({error:"施設名は160文字以内で入力してください。"},{status:400});
 if(!allowedTypes.has(submission_type)||!allowedCategories.has(category_slug)||!name)return NextResponse.json({error:"入力内容を確認してください。"},{status:400});
 const evidence_url=clean(b.evidence_url,2000);if(evidence_url.length>500)return NextResponse.json({error:"根拠URLは500文字以内で入力してください。"},{status:400});if(evidence_url){try{const u=new URL(evidence_url);if(!["http:","https:"].includes(u.protocol)||!u.hostname||u.username||u.password)throw new Error()}catch{return NextResponse.json({error:"根拠URLを確認してください。"},{status:400})}}
 const contact_email=clean(b.contact_email,1000);if(contact_email&&(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact_email)||contact_email.length>254))return NextResponse.json({error:"メールアドレスを確認してください。"},{status:400});
 if(["prefecture_name","address","note"].some(field=>b[field]!=null&&typeof b[field]!=="string"))return NextResponse.json({error:"入力内容を確認してください。"},{status:400});
 for(const [field,max] of [["prefecture_name",40],["address",300],["note",1200]] as const){if(typeof b[field]==="string"&&b[field].trim().length>max)return NextResponse.json({error:"入力文字数を確認してください。"},{status:400})}
 if(clean(b.prefecture_name,40)&&!validPrefectures.has(clean(b.prefecture_name,40)))return NextResponse.json({error:"都道府県名を確認してください。"},{status:400});
 if(b.evidence_url!=null&&typeof b.evidence_url!=="string")return NextResponse.json({error:"根拠URLを確認してください。"},{status:400});
 if(b.contact_email!=null&&typeof b.contact_email!=="string")return NextResponse.json({error:"メールアドレスを確認してください。"},{status:400});
 if(submission_type==="closure"&&!evidence_url&&!clean(b.note,1200))return NextResponse.json({error:"閉鎖・廃止の根拠URLまたは補足情報を入力してください。"},{status:400});
 const idText=b.place_id==null||b.place_id===""?null:typeof b.place_id==="number"||typeof b.place_id==="string"?String(b.place_id):"";const rawId=idText===null?null:/^[1-9]\d{0,14}$/.test(idText)?Number(idText):NaN;if(rawId!==null&&(!Number.isSafeInteger(rawId)||rawId<=0))return NextResponse.json({error:"施設IDを確認してください。"},{status:400});const place_id=rawId;
 if(submission_type!=="add"&&place_id===null)return NextResponse.json({error:"施設IDを確認してください。"},{status:400});
 if(submission_type==="add"&&place_id!==null)return NextResponse.json({error:"新規施設には施設IDを指定できません。"},{status:400});
 if(submission_type==="add"&&!clean(b.prefecture_name,40)&&!clean(b.address,300))return NextResponse.json({error:"新規施設には都道府県または住所を入力してください。"},{status:400});
 let error;try{const db=createClient(url,key);({error}=await db.from("place_submissions").insert({submission_type,place_id,category_slug,name,prefecture_name:clean(b.prefecture_name,40)||null,address:clean(b.address,300)||null,evidence_url:evidence_url||null,note:clean(b.note,1200)||null,contact_email:contact_email||null,status:"pending"}).abortSignal(AbortSignal.timeout(15000)))}catch{return NextResponse.json({error:"送信できませんでした。時間をおいて再度お試しください。"},{status:503})}
 if(error)return NextResponse.json({error:"送信できませんでした。時間をおいて再度お試しください。"},{status:503});
 return NextResponse.json({ok:true,status:"pending"});
}

