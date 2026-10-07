import type { Metadata } from "next";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

export const metadata: Metadata = {
  title: "にっぽんマップ｜日本の「どこ？」が、一目でわかる。",
  icons: { icon: [{ url: "/brand-mark.webp", type: "image/webp" }], apple: "/brand-mark.webp" },
  description: "全国の施設・スポットを地図で探せるビジュアル検索サービス",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="ja"><body>{children}</body></html>;
}
