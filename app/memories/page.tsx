import type {Metadata} from "next";
import PhotoMemories from "../../components/PhotoMemories";

export const metadata: Metadata = {
  title: "思い出マップ｜にっぽんマップ",
  robots: {index: false, follow: false},
};

export default async function MemoriesPage({searchParams}: {
  searchParams: Promise<{prefecture?: string; place?: string}>;
}) {
  const {prefecture, place} = await searchParams;
  return <PhotoMemories initialPrefecture={typeof prefecture === "string" ? prefecture : ""}
    initialPlace={typeof place === "string" ? place.slice(0, 120) : ""}/>;
}
