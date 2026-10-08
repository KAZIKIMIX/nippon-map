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
      license_url: "https://creativecommons.org/publicdomain/zero/1.0/",
      changes: "縮小・WebP変換",
      source_url: "https://commons.wikimedia.org/wiki/File:Kaiy%C5%ABkan.jpg",
    },
  },
  {"names": ["姫路城"], "category": "castle", "photo": {"url": "/place-photos/himeji.webp", "credit": "Loggieloggie / Wikimedia Commons", "license": "CC0", "license_url": "https://creativecommons.org/publicdomain/zero/1.0/", "source_url": "https://commons.wikimedia.org/wiki/File:Himeji_Castle_20260403120700.jpg", "changes": "縮小・WebP変換"}},
  {"names": ["松本城"], "category": "castle", "photo": {"url": "/place-photos/matsumoto.webp", "credit": "Milion Base / Wikimedia Commons", "license": "CC0", "license_url": "https://creativecommons.org/publicdomain/zero/1.0/", "source_url": "https://commons.wikimedia.org/wiki/File:Matsumoto_Castle_2024.jpg", "changes": "縮小・WebP変換"}},
  {"names": ["彦根城"], "category": "castle", "photo": {"url": "/place-photos/hikone.webp", "credit": "先従隗始 / Wikimedia Commons", "license": "CC0", "license_url": "https://creativecommons.org/publicdomain/zero/1.0/", "source_url": "https://commons.wikimedia.org/wiki/File:Hikone_Castle_20221113_02.jpg", "changes": "縮小・WebP変換"}},
  {"names": ["犬山城"], "category": "castle", "photo": {"url": "/place-photos/inuyama.webp", "credit": "Z3144228 / Wikimedia Commons", "license": "CC BY-SA 4.0", "license_url": "https://creativecommons.org/licenses/by-sa/4.0/", "source_url": "https://commons.wikimedia.org/wiki/File:Inuyama_castle_front_gate.jpg", "changes": "縮小・WebP変換"}},
  {"names": ["松江城"], "category": "castle", "photo": {"url": "/place-photos/matsue.webp", "credit": "Gmfrgsn (Greg Ferguson) / Wikimedia Commons", "license": "CC BY-SA 3.0", "license_url": "https://creativecommons.org/licenses/by-sa/3.0/", "source_url": "https://commons.wikimedia.org/wiki/File:MatsueCastle.jpg", "changes": "縮小・WebP変換"}},
];

export function GET(request: NextRequest) {
  const name = (request.nextUrl.searchParams.get("name") || "").normalize("NFKC").trim();
  const category = request.nextUrl.searchParams.get("category");
  const match = photos.find(item => item.category === category && item.names.includes(name));
  return NextResponse.json({ photo: match?.photo || null }, {
    headers: { "Cache-Control": "public, max-age=3600" },
  });
}
