import {createClient} from "@supabase/supabase-js";
import {NextRequest,NextResponse} from "next/server";
import {parseUsagePayload} from "../../../lib/usage-events";
export const dynamic="force-dynamic";
export async function POST(req:NextRequest) {
 const headers={"Cache-Control":"no-store"};
 const origin=req.headers.get("origin");
 if(origin!==req.nextUrl.origin)return NextResponse.json({error:"Invalid origin"},{status:403,headers});
 if(req.headers.get("dnt")==="1"||req.headers.get("sec-gpc")==="1")return new NextResponse(null,{status:204,headers});
 if(!req.headers.get("content-type")?.startsWith("application/json"))return NextResponse.json({error:"Invalid content type"},{status:415,headers});
 if(Number(req.headers.get("content-length"))>512)return NextResponse.json({error:"Request too large"},{status:413,headers});
 const reader=req.body?.getReader();if(!reader)return NextResponse.json({error:"Invalid request"},{status:400,headers});
 const chunks:Uint8Array[]=[];let size=0;
 while(true){const {done,value}=await reader.read();if(done)break;size+=value.length;if(size>512){await reader.cancel();return NextResponse.json({error:"Request too large"},{status:413,headers});}chunks.push(value);}
 const bytes=new Uint8Array(size);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.length;}
 let input:unknown;try{input=JSON.parse(new TextDecoder().decode(bytes));}catch{return NextResponse.json({error:"Invalid request"},{status:400,headers});}
 const payload=parseUsagePayload(input);if(!payload)return NextResponse.json({error:"Invalid event"},{status:400,headers});
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL,key=process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
 if(!url||!key)return NextResponse.json({error:"Usage unavailable"},{status:503,headers});
 try{
  const db=createClient(url,key,{auth:{persistSession:false,autoRefreshToken:false}});
  const {error}=await db.from("map_usage_events").insert({event_name:payload.event,category_slug:payload.category,source:payload.source});
  if(error)return NextResponse.json({error:"Usage unavailable"},{status:503,headers});
  return new NextResponse(null,{status:204,headers});
 }catch{return NextResponse.json({error:"Usage unavailable"},{status:503,headers});}
}
