import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[1-9]\d{0,14}$/.test(id)) return NextResponse.json({ details: null, error: "Invalid place ID" }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ details: null, error:"Database unavailable" }, { status: 503 });
  let db;try{db=createClient(url,key)}catch{return NextResponse.json({details:null},{status:503})}
  let data, error;try{({data,error}=await db.from("places").select("metadata").eq("id", id).eq("is_active", true).abortSignal(AbortSignal.timeout(15000)).maybeSingle())}catch{return NextResponse.json({details:null},{status:503})}
  if (error) return NextResponse.json({ details: null, error:"Details unavailable" }, { status: 503 });
  const metadata = data?.metadata;
  if(metadata!==null&&metadata!==undefined&&(typeof metadata!=="object"||Array.isArray(metadata)))return NextResponse.json({details:null});
  if (!metadata || !Array.isArray(metadata.routes)) return NextResponse.json({ details: null });
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((x): x is string => typeof x === "string" && x.trim().length>0).slice(0, 50).map(x=>x.trim().slice(0,160)) : [];
  return NextResponse.json({ details: { routes: [...new Set(strings(metadata.routes))], operators: [...new Set(strings(metadata.operators))], coordinate_note: typeof metadata.coordinate_note === "string" ? metadata.coordinate_note.trim().slice(0,500) : "" } }, { headers: { "Cache-Control": "public, max-age=300" } });
}
