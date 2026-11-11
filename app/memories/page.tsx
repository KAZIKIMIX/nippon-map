import CloudPhotoMemories from "../../components/CloudPhotoMemories";
import type {Metadata} from "next";
import PhotoMemories from "../../components/PhotoMemories";

export const metadata: Metadata = {
  title: "思い出マップ｜にっぽんマップ",
  robots: {index: false, follow: false},
};

export default async function MemoriesPage({searchParams}: {
  searchParams: Promise<{prefecture?: string; place?: string; mode?: string}>;
}) {
  const {prefecture, place, mode} = await searchParams;
  const initialPrefecture = typeof prefecture === "string" ? prefecture : "";
  const initialPlace = typeof place === "string" ? place.slice(0, 120) : "";
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  const params = new URLSearchParams({prefecture: initialPrefecture, place: initialPlace});
  if (url && key && process.env.SUPABASE_PHOTO_MEMORIES_SECRET_KEY) {
    if (mode === "cloud") {
      return <CloudPhotoMemories url={url} publishableKey={key} localHref={"/memories?" + params}
        initialPrefecture={initialPrefecture} initialPlace={initialPlace}/>;
    }
    params.set("mode", "cloud");
    return <PhotoMemories initialPrefecture={initialPrefecture} initialPlace={initialPlace}
      cloudHref={"/memories?" + params}/>;
  }
  return <PhotoMemories initialPrefecture={initialPrefecture} initialPlace={initialPlace}/>;
}
