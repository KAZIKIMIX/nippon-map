import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
export async function GET(request: NextRequest) {
  const id = request.nextUrl.searchParams.get("id");
  if (!id || !/^[1-9]\d{0,14}$/.test(id)) return NextResponse.json({ details: null }, { status: 400 });
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  if (!url || !key) return NextResponse.json({ details: null }, { status: 500 });
  const db = createClient(url, key);
  const { data, error } = await db.from("places").select("metadata").eq("id", id).eq("is_active", true).maybeSingle();
  if (error) return NextResponse.json({ details: null }, { status: 500 });
  const metadata = data?.metadata;
  if (!metadata || !Array.isArray(metadata.routes)) return NextResponse.json({ details: null });
  const strings = (value: unknown) => Array.isArray(value) ? value.filter((x): x is string => typeof x === "string").slice(0, 50) : [];
  return NextResponse.json({ details: { routes: strings(metadata.routes), operators: strings(metadata.operators), coordinate_note: typeof metadata.coordinate_note === "string" ? metadata.coordinate_note : "" } }, { headers: { "Cache-Control": "public, max-age=300" } });
}
