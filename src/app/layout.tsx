import type { Metadata, Viewport } from "next";
import "./globals.css";
import { baseUrl } from "@/lib/config";

export const metadata: Metadata = {
  metadataBase: new URL(baseUrl()),
  openGraph: { siteName: "Desafio KM", locale: "pt_BR", type: "website", images: [{ url: "/og.png", width: 1200, height: 630 }] },
  title: { default: "Desafio KM", template: "%s · Desafio KM" },
  description: "Desafios de corrida e caminhada com a família e os amigos.",
  appleWebApp: { capable: true, title: "Desafio KM", statusBarStyle: "default" },
};

export const viewport: Viewport = {
  themeColor: "#c2410c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          rel="stylesheet"
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700&family=Space+Grotesk:wght@600;700&display=swap"
        />
      </head>
      <body>{children}</body>
    </html>
  );
}
