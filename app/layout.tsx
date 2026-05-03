import type { Metadata, Viewport } from "next";
import "./globals.css";
import PWARegister from "@/components/PWARegister";

export const metadata: Metadata = {
  title: "YapıTakip — Bina & Daire Satış Yönetimi",
  description: "Müteahhitler için bina ve daire satış takip sistemi",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "YapıTakip",
  },
  formatDetection: { telephone: false },
  openGraph: {
    title: "YapıTakip",
    description: "Bina ve daire satış yönetim sistemi",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#1e3a8a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="tr" className="h-full">
      <head>
        {/* iOS icons */}
        <link rel="apple-touch-icon" sizes="180x180" href="/icons/icon-180.png" />
        <link rel="apple-touch-icon" sizes="152x152" href="/icons/icon-152.png" />
        {/* iOS splash screens — notch'lu telefon için */}
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="mobile-web-app-capable" content="yes" />
      </head>
      <body className="min-h-full bg-slate-50">
        {children}
        <PWARegister />
      </body>
    </html>
  );
}
