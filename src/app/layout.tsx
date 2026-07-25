import type { Metadata, Viewport } from "next";
import "./globals.css";

const metadataBase = new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://example.com");
const title = "星块爆破 | Star Pop";
const description = "轻点成片同色星块，挑战多种玩法、每日任务和更高分数。";
const socialImagePath = "/og.png";

export const metadata: Metadata = {
  metadataBase,
  title,
  description,
  openGraph: {
    title,
    description,
    type: "website",
    locale: "zh_CN",
    url: "/",
    images: [{ url: socialImagePath, width: 1536, height: 1024, alt: "星块爆破" }],
  },
  twitter: {
    card: "summary_large_image",
    title,
    description,
    images: [socialImagePath],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
