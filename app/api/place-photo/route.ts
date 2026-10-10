import { NextRequest, NextResponse } from "next/server";
import { getPlacePhoto } from "../../../lib/place-photos";

export function GET(request: NextRequest) {
 const name=(request.nextUrl.searchParams.get("name")||"").trim().slice(0,160);
 const category=request.nextUrl.searchParams.get("category");
 return NextResponse.json({photo:getPlacePhoto(name,category)}, {headers:{"Cache-Control":"public, max-age=3600"}});
}
