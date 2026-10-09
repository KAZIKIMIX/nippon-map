import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  metadataBase: new URL("https://nippon-map.vercel.app"),
  applicationName: "にっぽんマップ",
  alternates: { canonical: "/" },
  robots: { index: true, follow: true },
  openGraph: {
    type: "website", locale: "ja_JP", url: "/", siteName: "にっぽんマップ",
    title: "にっぽんマップ｜日本の施設・スポットを地図で探す",
    description: "水族館、動物園、道の駅、鉄道駅など、日本の施設・スポットをカテゴリや地域から探せます。",
    images: [{ url: "/brand-mark.webp", alt: "にっぽんマップのロゴ" }],
  },
  title: "にっぽんマップ｜日本の「どこ？」が、一目でわかる。",
  icons: { icon: [{ url: "/brand-mark.webp", type: "image/webp" }], apple: "/brand-mark.webp" },
  description: "水族館、動物園、道の駅、鉄道駅など、日本の施設・スポットを地図で検索。カテゴリや地域で絞り込み、施設の写真・住所・公式サイトを確認できます。掲載範囲はカテゴリごとに異なります。",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
