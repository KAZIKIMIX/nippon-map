import { NextRequest, NextResponse } from "next/server";

// Only manually verified facility matches and reusable photographs are published.
const photos = [
  {
    names: ["海遊館", "大阪海遊館"],
    category: "aquarium",
    photo: {
      url: "/place-photos/kaiyukan.webp",
      credit: "Sakai Yayoi / Wikimedia Commons",
      license: "CC0",
      source_url: "https://commons.wikimedia.org/wiki/File:Kaiy%C5%ABkan.jpg",
    },
  },
];

export function GET(request: NextRequest) {
  const name = (request.nextUrl.searchParams.get("name") || "").normalize("NFKC").trim();
  const category = request.nextUrl.searchParams.get("category");
  const match = photos.find(item => item.category === category && item.names.includes(name));
  return NextResponse.json({ photo: match?.photo || null }, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
