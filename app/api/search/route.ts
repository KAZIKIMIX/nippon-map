import {NextRequest,NextResponse} from "next/server";
import {reviewPlaces} from "../../../lib/review-fixtures";
export function GET(req:NextRequest){const q=(req.nextUrl.searchParams.get("q")||"").normalize("NFKC").toLowerCase().trim();const terms=q.split(/\s+/);const places=q?reviewPlaces.filter(p=>terms.every(term=>[p.name,p.prefecture_name,p.municipality_name,p.address].some(s=>s.normalize("NFKC").toLowerCase().includes(term)))):[];return NextResponse.json({places,has_more:false,partial:false});}
